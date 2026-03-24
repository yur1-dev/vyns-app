// models/NotificationState.ts
import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotificationState extends Document {
  userId: string;
  readIds: string[];
  deletedIds: string[];
  updatedAt: Date;
}

const NotificationStateSchema = new Schema<INotificationState>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    readIds: { type: [String], default: [] },
    deletedIds: { type: [String], default: [] },
  },
  { timestamps: true },
);

const NotificationState: Model<INotificationState> =
  mongoose.models.NotificationState ||
  mongoose.model<INotificationState>(
    "NotificationState",
    NotificationStateSchema,
  );

export default NotificationState;
