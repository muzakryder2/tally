import mongoose from "mongoose";

const listSchema = new mongoose.Schema(
  {
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    items: [
      {
        text: {
          type: String,
          required: true,
        },
        checked: {
          type: Boolean,
          required: true,
          default: false,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

const List = mongoose.model("List", listSchema);
export default List;
