// imports section

//
import { Document } from "mongoose";
// imports section end

export interface messageOptions {
  options: {
    sender: string;
    kaki: number;
    lala: string[];
  };
}
// added at: Mon Jul 05 2021 10:24:01 GMT+0300 (Israel Daylight Time)

// exports section
export interface messageDoc extends Document, messageOptions {}
// exports section end
