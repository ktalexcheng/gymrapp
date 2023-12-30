export const formatName = (firstName: string, lastName: string) => {
  // If name is Chinese, return last name first without space
  if (/^[\u4E00-\u9FA5]+$/.test(lastName + firstName)) {
    return `${lastName}${firstName}`
  }

  return `${firstName} ${lastName}`
}
