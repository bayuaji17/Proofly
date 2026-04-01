export const success = <T>(data: T, status: number = 200) => {
  return { status, data }
}

export const paginated = <T>(data: T[], total: number, page: number, pageSize: number) => {
  return {
    status: 200,
    data,
    total,
    page,
    page_size: pageSize
  }
}

export const errorResponse = (error: string, status: number) => {
  return { error, status }
}
