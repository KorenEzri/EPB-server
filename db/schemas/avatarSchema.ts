import mongoose, { Schema } from "mongoose";
import uniqueValidator from "mongoose-unique-validator";
import { avatarDoc } from "../../types";
const avatarSchema: Schema = new mongoose.Schema({
  id: { type: String, unique: true },
  kaki: { type: Number, unique: true },
  amount: Array,
});
avatarSchema.plugin(uniqueValidator);
avatarSchema.set("toJSON", {
  transform: (_: any, returnedObject: any) => {
    delete returnedObject.__v;
  },
});
export const avatarModel = mongoose.model<avatarDoc>(
  "avatarModel",
  avatarSchema
);
// asdasda
