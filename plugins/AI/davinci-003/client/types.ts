interface Personality {
  role: "system" | "user" | "assistant";
  content: string;
}


interface PersonalityConfig {
  name: string;
  personality: Personality[];
}

export { Personality, PersonalityConfig };
