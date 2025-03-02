import axios from 'axios'
import type { AxiosResponse } from 'axios'
import { toast } from 'svelte-sonner'

import { apiUrl } from '$lib/shared-variables.svelte'

async function handler(
  axiosReturn: Promise<AxiosResponse<any, any>>,
  onSuccess?: (data: any) => any,
  onError?: (error: any) => any
) {
  return axiosReturn
    .then((resp) => {
      if (onSuccess) {
        return onSuccess(resp.data)
      }
    })
    .catch((err) => {
      console.error(err)
      toast.error(err.message)
      if (onError) {
        return onError(err)
      }
    })
}

export class ApiClient {
  static async get(
    path: string,
    onSuccess?: (data: any) => any,
    onError?: (error: any) => any
  ) {
    return handler(axios.get(apiUrl + path), onSuccess, onError)
  }

  static async put(
    path: string,
    data: any,
    onSuccess?: (data: any) => any,
    onError?: (error: any) => any
  ) {
    return handler(axios.put(apiUrl + path, data), onSuccess, onError)
  }

  static async post(
    path: string,
    data: any,
    onSuccess?: (data: any) => any,
    onError?: (error: any) => any
  ) {
    return handler(axios.post(apiUrl + path, data), onSuccess, onError)
  }

  static async patch(
    path: string,
    data: any,
    onSuccess?: (data: any) => any,
    onError?: (error: any) => any
  ) {
    return handler(axios.patch(apiUrl + path, data), onSuccess, onError)
  }

  static async delete(
    path: string,
    onSuccess?: (data: any) => any,
    onError?: (error: any) => any
  ) {
    return handler(axios.delete(apiUrl + path), onSuccess, onError)
  }
}
