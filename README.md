# Preprint Recommender

## Overview

This project is designed to fetch the latest research papers from preprint servers and process them using Google GenAI embeddings.
By leveraging vector embeddings, it allows for filtering and identifying daily preprints that are most relevant to a set of "seed papers," helping researchers stay up-to-date with the most pertinent literature.

## How to run tests

To run the tests, you need to set up your environment with a Google GenAI API key.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the root directory of the project and add your API key:

```env
GENAI_API_KEY=your_google_genai_api_key
```

### 3. Execute tests

Run the test suite using npm:

```bash
npm test
```

The tests are configured to run in non-watch mode and will load the environment variables from your `.env` file automatically.
