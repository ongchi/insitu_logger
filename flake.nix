{
  inputs = {
    fenix = {
      url = "github:nix-community/fenix/monthly";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    naersk = {
      url = "github:nix-community/naersk";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    rust-overlay.url = "github:oxalica/rust-overlay";
  };

  outputs = {
    self,
    fenix,
    flake-utils,
    nixpkgs,
    naersk,
    rust-overlay,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      toolchain = fenix.packages.${system}.stable.toolchain;

      overlays = [ (import rust-overlay) ];
      pkgs = import nixpkgs {
        inherit system overlays;
      };

      naersk' = pkgs.callPackage naersk { cargo = toolchain; rustc = toolchain; };
    in {
      packages.default = [
        naersk'.buildPackage {
          name = "sqlx-cli";
          src = pkgs.fetchFromGitHub {
            owner = "launchbadge";
            repo = "sqlx";
          };
        }

        naersk'.buildPackage {
          name = "bacon";
          src = pkgs.fetchFromGitHub {
            owner = "Canop";
            repo = "bacon";
          };
        }
      ];

      devShells.default = pkgs.mkShell {
        buildInputs = [
          toolchain
          pkgs.libiconv
          pkgs.cargo-audit
          pkgs.sqlx-cli
          pkgs.bacon
        ];
        packages =
          [
            pkgs.nodejs_23
          ]
          ++ (with pkgs.nodePackages; [pnpm]);
        env = {
          RUST_LOG="debug";
          DATABASE_URL="sqlite://water_sampling.db";
        };
      };
    });
}
