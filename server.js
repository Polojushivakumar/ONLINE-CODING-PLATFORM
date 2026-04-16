import express from "express";
//import routes
import CompileRoute from './routes/CompileRoute.js';
import ProblemListRoute from "./routes/ProblemListRoute.js";
import ProblemRoute from "./routes/ProblemRoute.js";
import SubmitRoute from "./routes/SubmitRoute.js";
import ContestRoute from "./routes/ContestRoute.js";

import cors from "cors";
import mongoose from "mongoose";
import { mongoDBURL} from "./config.js";
import { PORT } from "./config.js";

//app config
const app = express();

//middleware
app.use(express.json());
app.use(cors());

//routes
app.use('/compile', CompileRoute);
app.use('/problemList', ProblemListRoute);
app.use('/problem', ProblemRoute);
app.use('/submit', SubmitRoute);
app.use('/battleground', ContestRoute);
    

// MongoDB connection with environment variables
if (mongoDBURL) {
    mongoose
        .connect(mongoDBURL)
        .then(() => {
            console.log('Connected to MongoDB successfully');
        })
        .catch((error) => {
            console.log('Error connecting to MongoDB, running without database:', error.message);
        });
} else {
    console.log('MongoDB URL not found - running in compilation-only mode');
}

// Start server regardless of MongoDB connection
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});