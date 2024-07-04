import fs from "fs"
import csv from "csv-parser"
import { Index } from "@upstash/vector"

type env ={
    VECTOR_URL : string,
    VECTOR_TOKEN : string
}

const index = new Index({
  url: process.env.VECTOR_URL,
  token: process.env.VECTOR_TOKEN,
})


interface Row {
    text: string;
}
async function parseCSV(filePath: string): Promise<Row[]> {
    return new Promise((resolve, reject) => {
        const rows: Row[] = [];

        fs.createReadStream(filePath)
            .pipe(csv({ separator: "," }))
            .on("data", (row: Row) => rows.push(row))
            .on("error", (err: any) => {
                reject(err)
            })
            .on("end", () => resolve(rows))

    })
}
const STEP = 30
const seed = async () => {
    const data = await parseCSV('training_dataset.csv')
    for (let i = 0; i < data.length; i += STEP) {
        const chunk = data.slice(i, i + STEP)
        const formatted = chunk.map((row, batchIndex) => ({
            data: row.text,
            id: i + batchIndex,
            metaData: { text: row.text }
        }))
        await index.upsert(formatted)
        

    }

}
seed();