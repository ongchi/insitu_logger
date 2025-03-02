pub mod iso8601 {
    use chrono::{DateTime, Local, NaiveDateTime, TimeZone};
    use serde::{self, Deserialize, Deserializer, Serializer};

    const FORMAT: &str = "%Y-%m-%dT%H:%M:%S%.3f%z";

    pub fn serialize<S>(date: &NaiveDateTime, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        let s = TimeZone::from_local_datetime(&Local, date)
            .single()
            .ok_or_else(|| serde::ser::Error::custom("Invalid datetime"))?
            .format(FORMAT)
            .to_string();
        serializer.serialize_str(&s)
    }

    pub fn deserialize<'de, D>(deserializer: D) -> Result<NaiveDateTime, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Ok(DateTime::parse_from_str(&s, FORMAT)
            .map_err(serde::de::Error::custom)?
            .naive_local())
    }
}

pub mod iso8601_option {
    use chrono::{DateTime, NaiveDateTime};
    use serde::{self, Deserialize, Deserializer, Serializer};

    const FORMAT: &str = "%Y-%m-%dT%H:%M:%S%.3f%z";

    pub fn serialize<S>(date: &Option<NaiveDateTime>, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        if let Some(date) = date {
            super::iso8601::serialize(date, serializer)
        } else {
            serializer.serialize_none()
        }
    }
    pub fn deserialize<'de, D>(deserializer: D) -> Result<Option<NaiveDateTime>, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = Option::<String>::deserialize(deserializer)?;
        if let Some(s) = s {
            Ok(Some(
                DateTime::parse_from_str(&s, FORMAT)
                    .map_err(serde::de::Error::custom)?
                    .naive_local(),
            ))
        } else {
            Ok(None)
        }
    }
}
