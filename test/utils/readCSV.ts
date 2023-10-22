import { parse } from "csv-parse"
import * as fs from "fs"
/**
 * Reads data from CSV file and returns an array of objects
 * @param {string} filePath Path to CSV file
 * @param {string} delimiter Delimiter used in the CSV file
 * @return {T[]} Array of objects of type T
 */
export async function readCSV<T>(filePath: string, delimiter: string): Promise<T[]> {
  // headers will map column name to the column index
  const headers: Map<string, number> = new Map()
  const result: T[] = []
  let lineNum = 1

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(parse({ delimiter, from_line: 1 }))
      .on("data", function (row: string[]) {
        if (lineNum === 1) {
          row.forEach((h, i) => headers.set(h, i))
        } else {
          const _rowData: { [key: string]: any } = {}
          headers.forEach((columnNum, columnName) => {
            // Try to convert to number, if successful, save it as a number
            const _num = Number(row[columnNum])
            if (!isNaN(_num)) {
              _rowData[columnName] = _num
            } else {
              _rowData[columnName] = row[columnNum]
            }
          })

          result.push(_rowData as T)
        }

        lineNum += 1
      })
      .on("end", function () {
        resolve(result)
      })
      .on("error", function (error) {
        reject(error.message)
      })
  })
}
