import { Document } from 'mongoose'
// imports section end

export interface avatarOptions {
  options: {
    id: string,
    kaki: number,
    amount: [string]
  }
}
// added at: Sat Jun 26 2021 10:01:17 GMT+0300 (Israel Daylight Time) 

// exports section
export interface avatarDoc extends Document, avatarOptions {}
// exports section end