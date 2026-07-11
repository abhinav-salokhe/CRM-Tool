// import { HttpError } from "../utils/httpError.js";
import { parse } from "csv-parse";

class CSVController {



  /**
   * Simple parse without validation
   */
  async simpleParse(req, res) {
    try {
      // 1. Check if file exists
      if (!req.file) {
        return res.status(400).json({ 
          error: 'Please upload a CSV file.' 
        });
      }

      // 2. Parse CSV
      const jsonRecords = [];
      const parser = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });

      for await (const record of parser) {
        jsonRecords.push(record);
      }

      // 3. Return parsed JSON
      return res.status(200).json({
        success: true,
        data: jsonRecords,
        count: jsonRecords.length,
      });

    } catch (error) {
      console.error("Parsing failed:", error);
      return res.status(500).json({ 
        error: 'Failed to parse CSV file.' 
      });
    }
  }


  //   async simpleParse(req, res) {
  //   try {
  //     const records = [];

  //     const parser = parse(req.file.buffer.toString("utf8"), {
  //       columns: true,
  //       trim: true,
  //       skip_empty_lines: true,
  //       bom: true,

  //       // Be as lenient as possible
  //       relax_quotes: true,
  //       relax_column_count: true,
  //       relax_column_count_less: true,
  //       relax_column_count_more: true,
  //       ignore_last_delimiters: true,
  //     });

  //     for await (const record of parser) {
  //       records.push(record);
  //     }

  //     return res.json(records);
  //   } catch (err) {
  //     console.error(err);
  //     return res.status(500).json({
  //       error: err.message,
  //     });
  //   }
  // }



}

export default new CSVController();