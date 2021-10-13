# OpenAI

A tiny async production-ready wrapper for [OpenAI GPT-3 API](https://beta.openai.com/docs/api-reference/introduction).

**This is an unofficial library and has no affiliations with OpenAI**

## Installation

### Via npm

```sh
npm install openai
```

### Via yarn

```sh
yarn add openai
```

## Usage

### Initialize OpenAI

```js
import { OpenAI } from 'openai';
// or the commonJS way:
const { OpenAI } = require('openai');

// new OpenAI(apikey: string, organization?: string, version?: string)
const openai = new OpenAI(process.env.API_KEY, 'my-organization');
```

### Engine

Get all engines:

```js
const engines = await openai.getEngines();
```

Get specific engine:

```js
const engine = await openai.getEngine('curie');
```

### Completion

Make a completion:

```js
const completion = await openai.complete('curie', {
    prompt: 'Q: Hello\nA:',
    user: 'user-123'
});
```

The options argument(2nd) properties follow the exactly same names as shown on official docs.

Make a completion from a fine-tuned model:

```js
const completion = await openai.completeFromModel('FINE_TUNED_MODEL', {
    prompt: 'Q: Hello\nA:'
});
```

Make a completion and stream the response:

```js
// Very experimental! Don't use on production!!!
// This API may change at any time
const stream = await openai.completeAndStream('curie', { // or completeFromModelAndStream
    prompt: 'Q: Hello\nA:',
    user: 'user-123'
});

stream.pipe(response)
```

Make a content filter:

```js
const isSafe = (await openai.contentFilter('hi I am cool')) === 0;
```

### Search

Make a search:

```js
const search = await openai.search('curie', {
    query: 'the president',
    documents: [
        'whitehouse',
        'school',
        'hospital'
    ]
});
```

The options argument(2nd) properties follow the exactly same names as shown on official docs.

### Classification

Classify a document:

```js
const classification = await openai.classify({
    examples: [
        ['A happy moment', 'Positive'],
        ['I am sad.', 'Negative'],
        ['I am feeling awesome', 'Positive']
    ],
    labels: ['Positive', 'Negative', 'Neutral'],
    query: 'It is a raining day :(',
    search_model: 'ada',
    model: 'curie'
});
```

The argument properties follow the exactly same names as shown on official docs.

### Answer

Answer a question:

```js
const answer = await openai.answer({
    documents: ['Puppy A is happy.', 'Puppy B is sad.'],
    question: 'which puppy is happy?',
    search_model: 'ada',
    model: 'curie',
    examples_context: 'In 2017, U.S. life expectancy was 78.6 years.',
    examples: [['What is human life expectancy in the United States?','78 years.']],
});
```

The argument properties follow the exactly same names as shown on official docs.

### File

Get all files:

```js
const files = await openai.getFiles();
```

Upload a single file:

```js
const result = await openai.uploadFile('filename.json', await fs.readFileSync('somefile.json'), 'fine-tune');
```

Get a single file by id:

```js
const file = await openai.getFile('file-29u89djwq');
```

Delete a single file by id:

```js
await openai.deleteFile('file-29u89djwq');
```

### Fine-tuning

Fine-tune from a file:

```js
const result = await openai.finetune({
    training_file: 'file-29u89djwq'
});
```

The argument properties follow the exactly same names as shown on official docs.

Get all fine-tunes:

```js
const finetunes = await openai.getFinetunes();
```

Get a specific fine-tune:

```js
const finetune = await openai.getFinetune('ftjob-AF1WoRqd3aJ');
```

Cancel a fine-tune:

```js
await openai.cancelFinetune('ftjob-AF1WoRqd3aJ');
```

Get fine-tune events of a fine-tune:

```js
const events = await openai.getFinetuneEvents('ftjob-AF1WoRqd3aJ');
```
