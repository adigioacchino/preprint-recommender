# Preprint Recommender

## Overview

This project is designed to fetch the latest research papers from preprint servers and process them using Google GenAI embeddings.
By leveraging vector embeddings, it allows for filtering and identifying daily preprints that are most relevant to a set of "seed papers," helping researchers stay up-to-date with the most pertinent literature.

## How to set up daily recommendations via GitHub Actions

You can set up daily recommendations using GitHub Actions.
This requires several conditions to be met:

- You need to have a Google GenAI API key, which you can obtain from free from [Google AI Studio](https://aistudio.google.com/). This key comes with 1000 free embedding requests per day, which should be sufficient for processing daily preprints across various categories.
- You need to have enough GitHub Actions minutes available in your account. Free accounts have 2000 minutes per month, which should be sufficient for running the daily workflow.

To set up the GitHub Actions workflow, follow the steps below.

### Repository setup

1. Fork this repository to your own GitHub account.
2. Go to the "Settings" tab of your forked repository.
3. Select "Secrets and variables" > "Actions".
4. Click on "New repository secret".
5. Add a new secret with the name `GENAI_API_KEY` and set its value to your Google GenAI API key.

### Seed papers setup

1. Create a folder named `seed_papers` in the root of your forked repository.
2. Add JSON files representing your seed papers in this folder. Each JSON file should have the following structure:

```json
{
  "title": "Title of the seed paper",
  "abstract": "Abstract of the seed paper"
}
```

We recommend starting with 5 to 10 seed papers that are closely related to your research interests.
Adding too few seed papers may result in less relevant recommendations, while adding too many results in higher number of suggestions, which reduces the interest of the daily recommendations.

### Configuration setup

As a last step, we need to configure `preprint-recommender` to decide which preprint servers we are interested in, and which categories to monitor.

To do that, you need to create a configuration file named `preprint-recommender-config.json` in the root of your forked repository.
This file should have the following structure:

```json
{
  "seedFolder": "./seed_papers",
  "arxivCategories": ["cs.AI", "cs.LG"],
  "biorxivCategories": ["bioinformatics", "genomics"],
}
```

You can customize the `arxivCategories` and `biorxivCategories` fields to match your research interests.
By removing one of the two fields, you can choose to monitor only one preprint server.

## Usage of the CLI interface

### Setting up the environment

You need to set up your environment with a Google GenAI API key, which needs to be stored in an environment variable named `GENAI_API_KEY`. For instance, in powershell you can do:

```powershell
$env:GENAI_API_KEY = "your_google_genai_api_key"
```

and in bash you can do:

```bash
export GENAI_API_KEY="your_google_genai_api_key"
```

Then you need to build the project using npm:

```bash
npm run build
```

### Preparing seed papers

You need to prepare a folder containing JSON files representing your seed papers.
Each JSON file should have the following structure:

```json
{
  "title": "Title of the seed paper",
  "abstract": "Abstract of the seed paper"
}
```

### Config file (optional)

You can create a configuration file named `preprint-recommender-config.json` in the root of your project to store default options.
This file should have the following structure (all fields are optional):

```json
{
  "seedFolder": "./seed_papers",
  "arxivCategories": ["cs.AI", "cs.LG"],
  "biorxivCategories": ["bioinformatics", "genomics"],
  "lookBack": "1",
  "maxResults": "50"
}
```

Any value provided via the CLI interface will override the corresponding value in the config file.

### Running the CLI interface

The main command is `npx preprint-recommender run`.

You can run it with the following options:

- `-c --config <path>`: Path to the configuration file (default: `preprint-recommender-config.json` in the current working directory).
- `-s --seed-folder <folder>`: Folder containing seed paper JSON files.
- `--arxiv-categories <categories>`: Space-separated list of arXiv categories to fetch papers from (e.g., cs.AI cs.LG).
- `--biorxiv-categories <categories>`: Space-separated list of bioRxiv categories to fetch papers from (e.g., bioinformatics genomics).
- `-l --look-back <days>`: Number of days to look back for papers (default: 1).
- `-m --max-results <results>`: Maximum number of papers to fetch (default: 50).

One between `--arxiv-categories` and `--biorxiv-categories` must be provided.
Example:

```bash
npx preprint-recommender run -s .\seed_papers\ --arxiv-categories cs.AI --biorxiv-categories bioinformatics
```

This will fetch the latest 50 papers that have been uploaded to the arXiv in the last day, in the categories cs.AI and cs.LG, and embed them using Google GenAI.

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
