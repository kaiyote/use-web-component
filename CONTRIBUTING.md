# How to Contribute

## Reporting bugs
- First, search the issues to confirm your bug hasn't been reported previously.
- Now that that's out of the way, the following info would be useful in debugging
  whats going on
  - a description of the issue
  - version of this package
  - `react` or `preact`
  - version of `(p)react`
  - the `web component` you're trying to use
  - a minimal reproducable example would be nice (not a hard requirement)

## Enhancements / Feature Requests
- Open an issue describing what the features you want would add to the module.
  We'll chat about it. It'll be great. Please note, I have a day job (which is
  where this module spawned from actually). As such, I can't be spending all my
  time on this package. ***This does not mean I'll ignore it.*** Just be
  patient.
- ***PRs are welcome.*** If you have the knowledge / time to implement your
  feature, that'd be awesome. Open the PR and we'll discuss it. Just make sure you
  adhere to the [code style](#code-style--linting).

## Code Style / Linting
- We use [standardjs](https://standardjs.com/) and `Typescript`.
- This means
  - no semi-colons
  - no double quotes
  - 2-space indentation
  - other things
- This repo has a `.editorconfig` file, and a fully configured `.eslintrc`.
  Provided your IDE of choice supports both `editorconfig` and `eslint` you
  shouldn't have an issue following the standards (aside from the linter
  yelling about all the code you type).
