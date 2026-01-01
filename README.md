# Preprint Recommender

## Overview

This project is designed to fetch the latest research papers from preprint servers and process them using Google GenAI embeddings.
By leveraging vector embeddings, it allows for filtering and identifying daily preprints that are most relevant to a set of "seed papers," helping researchers stay up-to-date with the most pertinent literature.

## How to set up daily recommendations via GitHub Actions

You can set up daily recommendations using GitHub Actions.
In this way, the workflow will run automatically every day, and you will receive a report by email with the most relevant preprints based on your seed papers.
This requires several conditions to be met:

- You need to have a Google GenAI API key, which you can obtain from free from [Google AI Studio](https://aistudio.google.com/). This key comes with 1000 free embedding requests per day, which should be sufficient for processing daily preprints across various categories.
- You need to have enough GitHub Actions minutes available in your account. Free accounts have 2000 minutes per month, which should be sufficient for running the daily workflow.
- If you want to receive the report by email, you will need to give Github Action enough permissions to send you an email. Email reporting is optional but recommended. If you don't set it up, the report will be available as log output of the GitHub Actions workflow.

To set up the GitHub Actions workflow, see the instructions in [`preprint-recommender-runner`](https://github.com/adigioacchino/preprint-recommender-runner).

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
  "lookBackDays": "1",
  "offsetDays": "7",
  "maxResults": "600",
  "verbose": true
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
- `--offset-days <days>`: Number of days to offset the look back period (default: 7).
- `-m --max-results <results>`: Maximum number of papers to fetch from Arxiv in each query (default: 2000).
- `-v --verbose`: Enable verbose logging.

One between `--arxiv-categories` and `--biorxiv-categories` must be provided (or given in the config file).
Example:

```bash
npx preprint-recommender run -s .\seed_papers\ --arxiv-categories cs.AI --biorxiv-categories bioinformatics
```

This will fetch the papers that have been uploaded to the arXiv and bioRxiv in 24h exactly a week ago, in the categories cs.AI (arXiv) and bioinformatics (bioRxiv), embed them using Google GenAI, and compare them to the seed papers in the `.\seed_papers\` folder.

## Remarks about the offset days

The `offsetDays` parameter allows you to specify a delay between the current date and the date range from which papers are fetched.
This is in practice necessary because preprint servers take some time to index newly uploaded papers.
In other words, papers uploaded today are generally not immediately available in the preprint server, but become available after a few days.
And once they become available, their "publication date" is set to the date they were originally uploaded, not the date they were made available.

So, with an `offsetDays` of 0, you are looking for papers uploaded today _that are already available on the preprint server_.
While this might return some results, it is likely that many papers uploaded today are not yet indexed and thus will not be found today, but will appear if the same query is run a few days later.

By sticking to the default value of 7 days for `offsetDays`, we ensure that we are fetching papers that have been uploaded a week ago and are now available on the preprint servers.

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

## Tagging strategy

As this project exposes a GitHub reusable workflow, we use two types of tags:

- **Immutable tags** of the form `vX.Y.Z` (e.g., `v1.0.0`, `v1.2.3`), which are never modified after creation. These tags follow semantic versioning (in a broad sense, that is changes to code but also to GitHub workflows and other changes trigger a new version). These tags shouldn't be used in the reusable workflow, as they would require frequent updates.
- **Floating tags** of the form `vX` (e.g., `v1`, `v2`), which are updated to point to the latest minor/patch version in the corresponding major version line. For instance, if the latest version is `v1.2.3`, then the floating tag `v1` will point to `v1.2.3`, then if a new version `v1.3.0` is released, the floating tag `v1` will be updated to point to `v1.3.0`. These floating tags should be used in the reusable workflow, as they allow for automatic updates to the latest version in the major version line.
