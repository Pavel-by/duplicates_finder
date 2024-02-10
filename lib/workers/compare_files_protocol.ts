interface CompareFilesRequest {
  filename1: string
  filename2: string
}

interface CompareFilesResponse {
  result: number
}

export {
  CompareFilesRequest,
  CompareFilesResponse,
}