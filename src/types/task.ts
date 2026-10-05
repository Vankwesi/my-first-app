export type Task = {
  id: number;
  text: string;
  timestamp: number; // epoch ms — exact date & time, source of truth
  done: boolean;
};