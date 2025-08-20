# Fix GitHub Issue

Please analyze and fix the GitHub issue: $ARGUMENTS.

Follow these steps:

1. **Analyze the Issue**
   - Use `gh issue view $ARGUMENTS` to get the complete issue details
   - Read and understand the problem description, expected vs actual behavior
   - Review any error messages, stack traces, or reproduction steps provided

2. **Investigate the Codebase**
   - Search the codebase for relevant files using appropriate search tools
   - Identify the components, functions, or modules that might be related to the issue
   - Examine the current implementation to understand the root cause

3. **Implement the Fix**
   - Make the necessary code changes to resolve the issue
   - Follow the established code patterns and TypeScript best practices
   - Ensure the fix addresses the root cause, not just the symptoms
   - Maintain code quality and consistency with the existing codebase

4. **Test the Solution**
   - Write or update tests to verify the fix works correctly
   - Run existing tests to ensure no regressions were introduced
   - Test edge cases and error scenarios if applicable

5. **Quality Assurance**
   - Run linting and type checking commands to ensure code quality
   - Verify the fix handles the originally reported scenario
   - Check that the solution follows project conventions

6. **Commit and Deploy**
   - Create a descriptive commit message that references the issue
   - Push the changes to the appropriate branch
   - Create a pull request with a clear description of the fix
   - Link the PR to the original issue for tracking

Remember to:
- Use the GitHub CLI (`gh`) for all GitHub-related tasks
- Follow the project's contributing guidelines
- Document any complex logic or architectural decisions
- Consider backward compatibility if making breaking changes