# Project Development Rules

## General Rules

1. **Git Commit and Push Policy**: Prompt the user to commit and push changes. NEVER commit or push changes without explicit approval from the user. Always ask first before running any git commit or git push commands.

## Feature Development Process Rules

1. **Step-by-Step Execution**: Execute feature development step-by-step for each feature phase. Break down work into clear, manageable steps and complete them one at a time.

2. **User Approval Between Steps**: Pause after completing each step and ask for input from the user before moving to the next step. Wait for explicit approval to proceed.

3. **Feature Development Process**: When implementing a feature in pullapod-cli, use the following steps:
    1. Create a new GitHub issue for the feature. Add the `enhancement` label to the issue
    2. Create a branch for the feature
    3. Review the previously added feature and its phases to understand the most recent changes to the project.
    4. Review the documentation feature in the pullapod-cli project. Requirements are in the `docs/requirements` directory and implementation details for the feature are the `docs/implementation` directory. Stop and ask for user input if you cannot find requirements and a corresponding implementation step or phase. Stop and ask for user input if the requirements and/or the implementation plan are unclear to you.
    5. Implement the corresponding step or phase using the requirements document and the implementation document.

## Documentation Rules

1. **Documentation is Stored in the docs/ Directory**: When creating documentation for features, troubleshooting, implementation plans, requirements, etc. Create and maintain documentation files in the `docs/` directory of the pullapod-cli project or in subdirectories of `docs/`.

2. **Documentation Subdirectories**: 
* Maintain requirements in the `docs/requirements` directory. 
* High-level feature and configuration documentation is maintained in `README.md` at the root of the `pullapod-cli` repository.
* Maintain feature detailed feature documentation in the `docs/features` directory. 
* Maintain implementation plans in the `docs/implementation` directory.
* Maintain test related documentation in the `docs/testing` directory.

## Testing Rules

1. **Maintain Separate Directories for Unit and Integration Tests**: 
* Unit tests are maintained in the `tests/unit` directory in this project.
* Integration tests are maintained in the `tests/integration` directory in this project.

## Linting Rules

1. **All Linting Warnings and Errors Must Be Resolved Before Work is Considered Complete**

* We don't allow for any unresolved linting warnings or errors. If linting identifies any errors or warnings, they must be fixed before we consider the feature, enhancement or bugfix complete.