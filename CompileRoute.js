import express from "express";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import url from "url";

const router = express.Router();

// Resolve __dirname in ES6 modules
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API endpoint for compiling code (Java and Python)
router.post("/", (req, res) => {
  const code = req.body.code;
  const input = req.body.input;
  const language = req.body.language || "java"; // Default to Java
  
  const tempInputFilePath = path.join(__dirname, "tempInput.txt");

  try {
    // Save the input to a temporary file
    fs.writeFileSync(tempInputFilePath, input);

    if (language.toLowerCase() === "python") {
      // Python execution
      const pythonFilePath = path.join(__dirname, "script.py");
      fs.writeFileSync(pythonFilePath, code);

      const startCompile = process.hrtime();
      
      // Python doesn't need compilation, just execution
      const runCommand = `python "${pythonFilePath}" < "${tempInputFilePath}"`;

      exec(runCommand, (runError, runStdout, runStderr) => {
        const [compileSeconds, compileNanoseconds] = process.hrtime(startCompile);
        const compileTime = "0.00"; // Python doesn't compile
        const executionTime = (
          compileSeconds * 1000 +
          compileNanoseconds / 1e6
        ).toFixed(2);

        if (runError) {
          res
            .status(400)
            .json({ error: runStderr, compileTime, executionTime });
        } else {
          res.json({
            output: runStdout,
            compileTime,
            executionTime,
            memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
          });
        }

        // Clean up temporary files
        try {
          fs.unlinkSync(pythonFilePath);
          fs.unlinkSync(tempInputFilePath);
        } catch (cleanupError) {
          console.error("Cleanup failed:", cleanupError);
        }
      });
    } else if (language.toLowerCase() === "c") {
      // C compilation and execution
      const cFilePath = path.join(__dirname, "program.c");
      const executablePath = path.join(__dirname, "program.exe");
      fs.writeFileSync(cFilePath, code);

      // Compile C code using gcc
      const compileCommand = `gcc "${cFilePath}" -o "${executablePath}"`;

      const startCompile = process.hrtime();

      exec(compileCommand, (error, stdout, stderr) => {
        const [compileSeconds, compileNanoseconds] = process.hrtime(startCompile);
        const compileTime = (
          compileSeconds * 1000 +
          compileNanoseconds / 1e6
        ).toFixed(2);

        if (error) {
          res.status(400).json({ error: stderr, compileTime });
          return;
        }

        // Execute the compiled C program
        const runCommand = `"${executablePath}" < "${tempInputFilePath}"`;

        const startRun = process.hrtime();

        exec(runCommand, (runError, runStdout, runStderr) => {
          const [runSeconds, runNanoseconds] = process.hrtime(startRun);
          const executionTime = (
            runSeconds * 1000 +
            runNanoseconds / 1e6
          ).toFixed(2);

          if (runError) {
            res
              .status(400)
              .json({ error: runStderr, compileTime, executionTime });
          } else {
            res.json({
              output: runStdout,
              compileTime,
              executionTime,
              memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
            });
          }

          // Clean up temporary files
          try {
            fs.unlinkSync(cFilePath);
            fs.unlinkSync(tempInputFilePath);
            fs.unlinkSync(executablePath);
          } catch (cleanupError) {
            console.error("Cleanup failed:", cleanupError);
          }
        });
      });
    } else {
      // Java execution (existing logic)
      const javaFilePath = path.join(__dirname, "Main.java");
      fs.writeFileSync(javaFilePath, code);

      // Compile the code using javac with quoted path to handle spaces
      const compileCommand = `javac "${javaFilePath}"`;

      const startCompile = process.hrtime();

      exec(compileCommand, (error, stdout, stderr) => {
        const [compileSeconds, compileNanoseconds] = process.hrtime(startCompile);
        const compileTime = (
          compileSeconds * 1000 +
          compileNanoseconds / 1e6
        ).toFixed(2);

        if (error) {
          res.status(400).json({ error: stderr, compileTime });
          return;
        }

        // Determine the execution command based on the platform with quoted paths
        const runCommand = `java -cp "${__dirname}" Main < "${tempInputFilePath}"`;

        const startRun = process.hrtime();

        exec(runCommand, (runError, runStdout, runStderr) => {
          const [runSeconds, runNanoseconds] = process.hrtime(startRun);
          const executionTime = (
            runSeconds * 1000 +
            runNanoseconds / 1e6
          ).toFixed(2);

          if (runError) {
            res
              .status(400)
              .json({ error: runStderr, compileTime, executionTime });
          } else {
            res.json({
              output: runStdout,
              compileTime,
              executionTime,
              memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024,
            });
          }

          // Clean up the temporary files
          try {
            fs.unlinkSync(javaFilePath);
            fs.unlinkSync(tempInputFilePath);
            fs.unlinkSync(path.join(__dirname, "Main.class"));
          } catch (cleanupError) {
            console.error("Cleanup failed:", cleanupError);
          }
        });
      });
    }
  } catch (writeError) {
    res.status(500).json({ error: "Failed to write temporary file" });
  }
});

export default router;
