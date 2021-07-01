// imports section 

//
import { Document } from 'mongoose'
// imports section end

export interface messageOptions {
  options: {
    content: string
  }
}
// added at: Thu Jul 01 2021 15:23:51 GMT+0300 (Israel Daylight Time) 

// exports section
export interface messageDoc extends Document, messageOptions {}
// exports section end