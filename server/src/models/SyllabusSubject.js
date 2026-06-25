import mongoose from 'mongoose';

const subTopicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hasVideo: { type: Boolean, default: true },
  hasNotes: { type: Boolean, default: true },
  hasDpp: { type: Boolean, default: true },
  hasDppVideo: { type: Boolean, default: true },
  hasMockTest: { type: Boolean, default: true }
});

const topicSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subTopics: [subTopicSchema]
});

const chapterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  topics: [topicSchema]
});

const syllabusSubjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  categories: [{ type: String, index: true }],
  chapters: [chapterSchema]
}, { timestamps: true });

export default mongoose.model('SyllabusSubject', syllabusSubjectSchema);
