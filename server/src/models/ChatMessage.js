import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderName: { type: String, required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true }, // null means it's addressed to general admin/support
    text: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

export default mongoose.model('ChatMessage', chatMessageSchema);
