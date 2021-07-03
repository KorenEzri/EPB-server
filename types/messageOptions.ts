// imports section 

//
import { Document } from 'mongoose'
// imports section end

export interface messageOptions {
  options: {
    sender: string,
    kaki: number,
    lala: string[]
  }
}
// added at: Fri Jul 02 2021 17:55:15 GMT+0300 (Israel Daylight Time) 

// exports section
export interface messageDoc extends Document, messageOptions {}
// exports section end