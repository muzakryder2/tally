import mongoose from "mongoose";

const listSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    items: [
      {
        _id: false,
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
