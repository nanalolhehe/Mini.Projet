#include <emscripten.h>

#include <stdio.h>

#include <stdlib.h>

#include <string.h>

#include <ctype.h>

#include <time.h>

#define MAX_USERS 500
#define MAX_NAME_LENGTH 64
#define MAX_WORD_LENGTH 20
#define MAX_WORDS 100
#define MAX_LETTERS 12
#define MIN_WORD_LENGTH 2

typedef struct {
  char name[MAX_NAME_LENGTH];
  char surname[MAX_NAME_LENGTH];
  int age;
  int level;
  int score;
}
User;

typedef struct {
  char letters[MAX_LETTERS];
  int letterCount;
  char foundWords[MAX_WORDS][MAX_WORD_LENGTH];
  int foundWordCount;
  int requiredWords;
  int minLength;
  int level;
  int selectedLetters[MAX_LETTERS];
  int selectedLetterCount;
}
GameState;

User users[MAX_USERS];
int userCount = 0;
User * currentUser = NULL;
GameState gameState;

const char VOWELS[] = {
  'e',
  'a',
  'i',
  'o',
  'u',
  'y'
};
const int VOWEL_WEIGHTS[] = {
  8,
  7,
  6,
  5,
  3,
  2
};
const char CONSONANTS[] = {
  's',
  'n',
  't',
  'r',
  'l',
  'd',
  'c',
  'm',
  'p',
  'g',
  'b',
  'v',
  'h',
  'f',
  'q',
  'j',
  'x',
  'z',
  'k',
  'w'
};
const int CONSONANT_WEIGHTS[] = {
  8,
  7,
  7,
  6,
  6,
  5,
  5,
  5,
  4,
  3,
  3,
  3,
  2,
  2,
  1,
  1,
  1,
  1,
  0,
  0
};
const char * COMMON_ENDINGS[] = {
  "er",
  "ir",
  "re",
  "ez",
  "ent",
  "ant",
  "tion",
  "ment",
  "age",
  "ois",
  "ais",
  "uit",
  "eur",
  "ien"
};
const int COMMON_ENDINGS_COUNT = 14;
const char * COMMON_PREFIXES[] = {
  "re",
  "de",
  "in",
  "en",
  "em",
  "con",
  "com",
  "par",
  "sur",
  "sous",
  "entre",
  "trans",
  "anti"
};
const int COMMON_PREFIXES_COUNT = 13;

const char * frenchDict[] = {
  "a",
  "age",
  "ai",
  "aie",
  "aient",
  "aies",
  "ait",
  "alors",
  "as",
  "au",

};
const int DICT_SIZE = sizeof(frenchDict) / sizeof(frenchDict[0]);

void startGame();

char getRandomVowel() {
  int totalWeight = 0;
  for (int i = 0; i < sizeof(VOWEL_WEIGHTS) / sizeof(VOWEL_WEIGHTS[0]); i++) {
    totalWeight += VOWEL_WEIGHTS[i];
  }

  int random = rand() % totalWeight;
  int cumulative = 0;

  for (int i = 0; i < sizeof(VOWEL_WEIGHTS) / sizeof(VOWEL_WEIGHTS[0]); i++) {
    cumulative += VOWEL_WEIGHTS[i];
    if (random < cumulative) {
      return VOWELS[i];
    }
  }

  return 'e';
}

char getRandomConsonant() {
  int totalWeight = 0;
  for (int i = 0; i < sizeof(CONSONANT_WEIGHTS) / sizeof(CONSONANT_WEIGHTS[0]); i++) {
    totalWeight += CONSONANT_WEIGHTS[i];
  }

  int random = rand() % totalWeight;
  int cumulative = 0;

  for (int i = 0; i < sizeof(CONSONANT_WEIGHTS) / sizeof(CONSONANT_WEIGHTS[0]); i++) {
    cumulative += CONSONANT_WEIGHTS[i];
    if (random < cumulative) {
      return CONSONANTS[i];
    }
  }

  return 's';
}

void shuffleArray(char * array, int size) {
  for (int i = size - 1; i > 0; i--) {
    int j = rand() % (i + 1);
    char temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}

User * findUser(const char * name) {
  for (int i = 0; i < userCount; i++) {
    if (strcasecmp(users[i].name, name) == 0) {
      return & users[i];
    }
  }
  return NULL;
}

EMSCRIPTEN_KEEPALIVE
const char * get_name() {
  return currentUser ? currentUser -> name : NULL;
}
EMSCRIPTEN_KEEPALIVE
const char * get_surname() {
  return currentUser ? currentUser -> surname : NULL;
}
EMSCRIPTEN_KEEPALIVE int get_age() {
  return currentUser ? currentUser -> age : -1;
}
EMSCRIPTEN_KEEPALIVE int get_level() {
  return currentUser ? currentUser -> level : -1;
}
EMSCRIPTEN_KEEPALIVE int get_score() {
  return currentUser ? currentUser -> score : -1;
}
EMSCRIPTEN_KEEPALIVE int hasCurrentUser() {
  return currentUser != NULL;
}

EMSCRIPTEN_KEEPALIVE void set_level(int val) {
  currentUser -> level = val;
}
EMSCRIPTEN_KEEPALIVE void set_score(int val) {
  currentUser -> score = val;
}

EMSCRIPTEN_KEEPALIVE void reset_user() {
  currentUser = NULL;
}

void generatePlayableLetters(int count) {

  memset(gameState.letters, 0, sizeof(gameState.letters));
  gameState.letterCount = 0;

  int vowelCount = (count * 0.35) + 0.5; 
  if (vowelCount < 2) vowelCount = 2;
  int consonantCount = count - vowelCount;

  for (int i = 0; i < vowelCount; i++) {
    gameState.letters[gameState.letterCount++] = getRandomVowel();
  }

  for (int i = 0; i < consonantCount; i++) {
    gameState.letters[gameState.letterCount++] = getRandomConsonant();
  }

  if (rand() % 3 == 0) {
    const char * commonPart;
    if (rand() % 2 == 0) {
      commonPart = COMMON_PREFIXES[rand() % COMMON_PREFIXES_COUNT];
    } else {
      commonPart = COMMON_ENDINGS[rand() % COMMON_ENDINGS_COUNT];
    }

    int partLen = strlen(commonPart);
    for (int i = 0; i < partLen && gameState.letterCount < count; i++) {
      gameState.letters[gameState.letterCount++] = commonPart[i];
    }
  }

  while (gameState.letterCount < count) {
    if (rand() % 2 == 0) {
      gameState.letters[gameState.letterCount++] = getRandomVowel();
    } else {
      gameState.letters[gameState.letterCount++] = getRandomConsonant();
    }
  }

  shuffleArray(gameState.letters, gameState.letterCount);
}

int isValidWord(const char * word,
  const char * letters) {
  int letterCounts[26] = {
    0
  };

  for (int i = 0; letters[i]; i++) {
    char c = tolower(letters[i]);
    if (c >= 'a' && c <= 'z') {
      letterCounts[c - 'a']++;
    }
  }

  for (int i = 0; word[i]; i++) {
    char c = tolower(word[i]);
    if (c < 'a' || c > 'z') return 0;

    if (letterCounts[c - 'a'] <= 0) {
      return 0;
    }
    letterCounts[c - 'a']--;
  }

  return 1;
}

int isWordInDictionary(const char * word) {
  return EM_ASM_INT({
    var jsStr = UTF8ToString($0);
    return isWordInDictionary(jsStr); 
  }, word);
}

EMSCRIPTEN_KEEPALIVE void toggleLetterSelection(int index) {

  for (int i = 0; i < gameState.selectedLetterCount; i++) {
    if (gameState.selectedLetters[i] == index) {

      for (int j = i; j < gameState.selectedLetterCount - 1; j++) {
        gameState.selectedLetters[j] = gameState.selectedLetters[j + 1];
      }
      gameState.selectedLetterCount--;
      return;
    }
  }

  if (gameState.selectedLetterCount < MAX_LETTERS) {
    gameState.selectedLetters[gameState.selectedLetterCount++] = index;
  }
}

EMSCRIPTEN_KEEPALIVE int submitWord(const char * word) {

  if (strlen(word) == 0) return 1;

  if (strcmp(word, "0") == 0 || strcasecmp(word, "save") == 0) return 2;

  if (strlen(word) < gameState.minLength) return 3;

  if (!isValidWord(word, gameState.letters)) return 4;

  if (!isWordInDictionary(word)) return 5;

  for (int i = 0; i < gameState.foundWordCount; i++) {
    if (strcasecmp(word, gameState.foundWords[i]) == 0) {
      return 6;
    }
  }

  strcpy(gameState.foundWords[gameState.foundWordCount], word);
  gameState.foundWordCount++;
  currentUser -> score += strlen(word) * gameState.level;

  gameState.selectedLetterCount = 0;

  if (gameState.foundWordCount >= gameState.requiredWords) {
    return 7;
  }

  return 0;
}

EMSCRIPTEN_KEEPALIVE void startGame() {

  memset( & gameState, 0, sizeof(gameState));
  gameState.level = currentUser -> level;

  gameState.letterCount = (5 + gameState.level / 2);
  if (gameState.letterCount > MAX_LETTERS) gameState.letterCount = MAX_LETTERS;

  gameState.requiredWords = 2 + gameState.level / 3;
  if (gameState.requiredWords > 10) gameState.requiredWords = 10;

  gameState.minLength = 2 + gameState.level / 5;
  if (gameState.minLength < MIN_WORD_LENGTH) gameState.minLength = MIN_WORD_LENGTH;

  generatePlayableLetters(gameState.letterCount);
}

int userExists(const char * name) {
  currentUser = findUser(name);
  if (currentUser) return true;
  return false;
}

void handleRegister(const char * name,
  const char * surname, int age) {
  User newUser;
  strcpy(newUser.name, name);
  strcpy(newUser.surname, surname);
  newUser.age = age;
  newUser.level = 1;
  newUser.score = 0;

  users[userCount++] = newUser;
  currentUser = & users[userCount - 1];
}

EMSCRIPTEN_KEEPALIVE int get_min_length() {
  return gameState.minLength;
}

EMSCRIPTEN_KEEPALIVE int get_found_words_count() {
  return gameState.foundWordCount;
}

EMSCRIPTEN_KEEPALIVE int get_letter_count() {
  return gameState.letterCount;
}

EMSCRIPTEN_KEEPALIVE int get_user_count() {
  return userCount;
}

EMSCRIPTEN_KEEPALIVE int get_selected_letter_count() {
  return gameState.selectedLetterCount;
}

EMSCRIPTEN_KEEPALIVE int get_required_words() {
  return gameState.requiredWords;
}

EMSCRIPTEN_KEEPALIVE
const char * getFoundWord(int index) {
  return gameState.foundWords[index];
}

EMSCRIPTEN_KEEPALIVE
const char getLetter(int index) {
  return gameState.letters[index];
}

EMSCRIPTEN_KEEPALIVE int getSelectedLetter(int index) {
  return gameState.selectedLetters[index];
}

void storeUsersFromJS(User * users_db, int count) {
  userCount = count;
  for (int i = 0; i < userCount; i++) {
    EM_ASM({
      console.log("Score from EM_ASM:", $0);
    }, users_db[i].age);
    users[i] = users_db[i]; 
  }

}

User * getStoredUsers() {
  return users;
}

int getStoredUserCount() {
  return userCount;
}