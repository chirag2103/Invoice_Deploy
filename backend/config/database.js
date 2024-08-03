import mongoose from 'mongoose';
import dotenv from 'dotenv';

const connectDb = () => {
  mongoose
    .connect(process.env.MONGOURI)
    .then((conn) => {
      console.log(conn.connection.host);
    })
    .catch((err) => {
      console.log(err);
    });
};

export default connectDb;
