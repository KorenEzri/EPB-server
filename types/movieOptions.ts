// imports section 

//
import { Document } from 'mongoose'
// imports section end

export interface movieOptions {
  options: {
    name: string,
    duration: number,
    views: number,
    cast: string[]
  }
}
// added at: Thu Jul 08 2021 13:13:35 GMT+0300 (Israel Daylight Time) 

// exports section
export interface movieDoc extends Document, movieOptions {}
// exports section end