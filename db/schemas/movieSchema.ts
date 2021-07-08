import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { movieDoc } from "../../types";
const movieSchema: Schema = new mongoose.Schema({
  name: { type: String, unique: true },
  duration: Number,
  views: Number,
  cast: Array,
});
movieSchema.plugin(uniqueValidator);
movieSchema.set("toJSON", {
  transform: (_: any, returnedObject: any) => {
    delete returnedObject.__v;
  },
});
export const MovieModel = mongoose.model<movieDoc>("MovieModel", movieSchema);
//
