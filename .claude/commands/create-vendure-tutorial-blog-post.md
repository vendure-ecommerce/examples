# Create Vendure Tutorial Blog Post

Generate a compelling blog post that "teases" a Vendure tutorial guide, following the established pattern for GitHub SSO, Google SSO, and CloudFlare R2 posts. Input: $ARGUMENTS (example name or service/platform to feature)

This command creates marketing-focused blog posts that highlight a specific technology's unique value proposition while positioning Vendure as the ideal integration platform.

## 1. Analysis and Research Phase

### Understand the Target Technology
- **Parse the input**: "$ARGUMENTS" (e.g., "s3-file-storage/aws-s3", "payment-integration/stripe", "auth-strategy/microsoft-oauth", or with documentation link)
- **Extract documentation links**: If a Vendure documentation URL is provided in arguments, note it for mandatory research
- **Identify the core service/platform**: Extract the main technology (AWS S3, Stripe, Microsoft, etc.)
- **Research the platform's standout features**: What makes this service unique compared to competitors?
- **Understand the business problem**: What pain point does this technology solve for e-commerce?

### Research Platform Differentiators
Identify the **single most compelling feature** that sets this platform apart:

**Examples of Standout Features:**
- **CloudFlare R2**: Zero egress fees + global edge caching
- **GitHub OAuth**: Developer-friendly authentication + code repository integration
- **Google OAuth**: Ubiquitous user adoption + trusted identity provider
- **AWS S3**: Industry standard + comprehensive ecosystem
- **Stripe**: Developer experience + global payment processing
- **MinIO**: Self-hosted control + zero vendor lock-in
- **Digital Ocean**: Predictable pricing + developer-focused simplicity

### Mandatory Vendure Documentation Research
**CRITICAL**: Before writing any learning outcomes, you MUST research the actual Vendure documentation to ensure accuracy.

**If documentation link provided in arguments:**
1. **Read the provided Vendure documentation URL** using WebFetch or Read tools
2. **Extract the exact steps and procedures** covered in the tutorial
3. **Note specific Vendure APIs and functions** mentioned in the documentation
4. **Identify prerequisites and setup requirements** listed in the guide
5. **Document the actual learning outcomes** from the tutorial content

**If no documentation link provided:**
1. **Search for relevant Vendure documentation** using WebSearch or Context7 MCP
2. **Look for tutorials in** `/vendure/docs/docs/guides/how-to/` directory structure
3. **Check the examples directory** for related implementation patterns
4. **Verify tutorial content exists** before proceeding with blog post creation

**Key Documentation Sources:**
- Vendure main documentation: `https://docs.vendure.io/`
- How-to guides: `/vendure/docs/docs/guides/how-to/`
- Examples repository: Local examples directory
- API documentation: Context7 MCP server

### Analyze Target Audience Pain Points
Research common challenges in the problem space:
- **E-commerce specific issues**: What problems do online stores face?
- **Technical implementation barriers**: What makes integration typically difficult?
- **Business impact**: How do these problems affect revenue, user experience, or costs?
- **Competitive landscape**: What alternatives exist and why might they fall short?

## 2. Content Structure Template

### Title Formula
`[Compelling Action Verb] + [Key Benefit] + with [Technology] + and Vendure`

**Examples:**
- "Eliminate Asset Storage Costs with CloudFlare R2 and Vendure"
- "Unlock Global Payment Processing with Stripe and Vendure" 
- "Achieve Developer-Friendly Authentication with GitHub OAuth and Vendure"
- "Scale File Storage Without Vendor Lock-in using MinIO and Vendure"

### Title Generation Rules

**Exclude "Vendure" from the Title**: The main SEO_title must not contain the word "Vendure". The context of the blog is sufficient.

**Use Action-Oriented Language**: Titles must be structured to feel like a guide. Start with or include action-oriented words like "Integrating," "A Guide to," "How to Implement," "Leveraging," or "Deploying."

**Front-Load the Key Technology**: The primary technology name (e.g., "Hetzner Object Storage," "AWS S3") should appear at or near the beginning of the title for immediate recognition.

**Ensure a Single-Sentence Flow**: The title must be a complete, grammatically correct sentence. Avoid "Topic: Description" formats that use a colon.

**Be Specific and Factual, Avoid Hyperbole**:
- Do not use generic or overused marketing verbs like "Simplify." Instead, pull stronger, more descriptive terms from the article body (e.g., "Streamlined," "Developer-Focused," "Policy-Driven").
- Avoid unsubstantiated or grandiose claims like "The Gold Standard." Use more factual and professional alternatives like "The Industry Standard."
- Be precise about benefits. For example, "without Egress Costs" is better than the more general "without the Cost."

**Revised Title Examples (Following New Rules):**
- "Integrating CloudFlare R2 for Asset Storage without Egress Costs"
- "A Guide to Stripe Payment Processing for Global E-commerce"
- "How to Implement GitHub OAuth for Developer-Friendly Authentication"
- "Leveraging MinIO for Self-Hosted Object Storage Solutions"

### Subtitle Formula
`[Scale/Enable/Implement] your [business goal] [unique advantage]. Learn to integrate [specific capability] with Vendure's [relevant architectural strength].`

**Examples:**
- "Scale your e-commerce asset delivery globally without worrying about egress fees. Learn to integrate CloudFlare R2's zero-cost data transfer with Vendure's built-in S3 compatibility."
- "Process payments globally with developer-friendly APIs. Learn to integrate Stripe's comprehensive payment platform with Vendure's extensible payment framework."

## 3. Four-Section Blog Structure

### Section 1: Problem Identification
**Pattern**: "[Action Verb] + [Constraint/Limitation]"

**Formula:**
```
[Problem Context] + [Specific Pain Points] + [Business Impact]

For [target audience/business type], [common challenge] can [specific negative consequence]. These [issues] often [when they occur], especially [specific scenarios].

For [business context], these [challenges] can become [severity] and [predictability issue], forcing [difficult business decisions].
```

**Tonality Guidelines:**
- Start with relatable business challenges
- Use specific, concrete examples
- Focus on business impact, not just technical issues
- Create urgency without being alarmist
- Use "can become" rather than "will become" for measured tone

**Examples:**
- "Traditional cloud storage providers charge substantial fees for data transfer, which can quickly escalate costs..."
- "Long registration forms are a major point of friction for customers. Forcing users to create yet another password leads to..."
- "Managing file storage infrastructure can become complex and expensive as your e-commerce store scales..."

### Section 2: Technology's Unique Value Proposition
**Pattern**: "[Technology Name]: [Unique Capability] Built for [Target Use Case]"

**Formula:**
```
[Technology Name] [revolutionary action/approach] by [unique differentiator]. Combined with [complementary feature], [Technology] [specific advantage] to your [target users], providing both [benefit 1] and [benefit 2].

This makes [Technology] particularly compelling for [specific use case] where [relevant concerns] and [business requirement] is crucial for [business outcome].
```

**Key Requirements:**
- Lead with the platform's most distinctive feature
- Explain the "why" behind the advantage
- Connect technical capabilities to business outcomes
- Use power words: "revolutionizes", "eliminates", "transforms"
- Be specific about the value proposition

**Examples:**
- "CloudFlare R2 revolutionizes object storage economics by eliminating data egress fees entirely..."
- "GitHub OAuth provides seamless authentication leveraging developers' existing professional identities..."
- "MinIO transforms storage architecture by providing enterprise-grade S3 compatibility with complete infrastructure control..."

### Section 3: Vendure's Architectural Advantage
**Pattern**: "Leverage Vendure's [Relevant Architecture] for Your [Integration] Integration"

**Formula:**
```
While the benefits are clear, [implementation challenge] can be [difficulty level] on platforms with [platform limitation]. Vendure's architecture provides a decisive advantage here.

Vendure's [specific architectural feature] is designed [design philosophy] for precisely this kind of customization. [Elaboration of architectural advantage]. This means you can [specific benefit] without [traditional drawbacks].

The result is [outcome description]: [benefit 1], [benefit 2], and [benefit 3], all integrated seamlessly into your Vendure commerce platform.
```

**Key Architectural Features to Highlight:**
- **Authentication**: "powerful and extensible authentication framework"
- **Payments**: "flexible payment processing architecture" 
- **Storage**: "built-in S3 compatibility" or "configurable asset storage strategies"
- **APIs**: "GraphQL-first API design" or "headless commerce architecture"
- **Plugins**: "modular plugin system" or "composable architecture"

**Tonality Guidelines:**
- Position Vendure as the solution to implementation complexity
- Use technical accuracy without jargon
- Emphasize "without compromise" or "seamless integration"
- Contrast with "rigid systems" or "cumbersome workarounds"

### Section 4: Call-to-Action with Learning Outcomes
**Pattern**: "Follow Our [Scope] [Technology] Integration Guide"

**Formula:**
```
Ready to [compelling action related to main benefit]? Our [scope] tutorial walks you through the entire [Technology] [integration process].

**Vendure Documentation: [Technology] [Integration Type] Tutorial**

### What You'll Implement and Learn

This guide demonstrates how to use Vendure's [relevant feature] to implement [Technology] integration. You will learn how to:

- **[Action 1]** [specific implementation detail] for [purpose]
- **[Action 2]** using Vendure's [specific feature or API]  
- **[Action 3]** to [business outcome] from [Technology capability]
- **[Action 4]** from [migration source] to [new system]
- **[Action 5]** with [Technology feature] and [integration detail]
- **[Action 6]** with [scaling benefit] regardless of [scaling factor]
```

**Learning Outcomes Guidelines:**
**MANDATORY ACCURACY REQUIREMENTS:**
- **Base ALL learning outcomes on actual documentation content** - no speculation or hallucination
- **Use exact terminology** from the Vendure documentation
- **Reference only features and APIs** that are actually covered in the tutorial
- **Include only steps that are actually documented** in the guide

**Structure Requirements:**
- 5-6 bullet points maximum
- Start each with a strong action verb: "Create", "Configure", "Implement", "Generate", "Test"
- Include both technical setup and verification steps
- Reference specific Vendure functions mentioned in documentation (e.g., `configureS3AssetStorage`)
- End with testing or validation step from the tutorial
- Use parallel structure for consistency

**Accuracy Validation:**
- Cross-reference each bullet point with documentation content
- Avoid adding steps not covered in the actual tutorial
- Don't mention advanced features unless they're in the guide
- Stick to the actual scope of the documentation

## 4. Tonality and Voice Guidelines

### Writing Style Requirements

**Professional Yet Accessible:**
- Use industry terminology accurately but explain complex concepts
- Avoid excessive jargon or acronyms without context
- Write for senior developers and technical decision-makers
- Maintain authority without being condescending

**Confident and Solution-Oriented:**
- Present Vendure as the obvious choice, not one option among many
- Use definitive language: "provides", "enables", "ensures" vs "might help"
- Focus on outcomes and benefits rather than features
- Acknowledge challenges but emphasize solutions

**Measured and Credible:**
- Avoid hyperbole or unrealistic claims
- Use specific examples and concrete benefits
- Acknowledge when solutions require proper setup/configuration
- Balance enthusiasm with technical accuracy

### Language Patterns to Follow

**Power Phrases:**
- "decisive advantage" 
- "seamless integration"
- "without compromise"
- "enterprise-grade reliability"
- "production-ready"
- "powerful combination"

**Transition Phrases:**
- "While the benefits are clear..."
- "This is where Vendure's architecture provides..."
- "The result is a powerful combination..."
- "Ready to [action]? Our comprehensive tutorial..."

**Avoid These Patterns:**
- Overly technical jargon without explanation
- Vague benefits like "easy to use" or "flexible"
- Comparison tables or feature lists
- Implementation details in the blog post
- Weak language like "might", "could", "potentially"

## 5. Platform-Specific Research Guide

### Key Research Areas for Each Platform Type

**Storage Platforms (S3-compatible, Cloud Storage):**
- Cost structure (storage, egress, operations)
- Geographic distribution and CDN integration
- Compliance and security features
- API compatibility and migration ease
- Performance characteristics

**Authentication Providers (OAuth, SSO):**
- User base and adoption rates
- Developer experience and documentation quality
- Enterprise features and compliance
- Integration complexity and maintenance
- Trust and brand recognition

**Payment Processors:**
- Geographic coverage and supported payment methods
- Fee structure and transparent pricing
- Developer tools and API quality
- Regulatory compliance and security
- Integration complexity and maintenance

**Infrastructure Services:**
- Control vs managed service trade-offs
- Scaling characteristics and pricing models
- Ecosystem integration and compatibility
- Deployment and maintenance complexity
- Vendor lock-in considerations

### Competitive Positioning Research

For each platform, research:
1. **Top 3-4 competitors** in the same space
2. **Unique differentiators** that set the featured platform apart
3. **Common pain points** with alternative solutions
4. **Business cases** where this platform excels
5. **Technical advantages** that matter to developers

## 6. Content Creation Process

### Step 1: MANDATORY Documentation Research
**BEFORE creating any content outline:**

1. **Documentation Analysis**:
   ```bash
   # If documentation link provided in arguments
   - Read the complete Vendure documentation using WebFetch/Read tools
   - Extract step-by-step procedures from the tutorial
   - Note exact Vendure APIs and functions mentioned
   - Document prerequisites and setup requirements
   - List actual learning outcomes from the guide
   
   # If no documentation link provided
   - Search for relevant Vendure documentation using WebSearch
   - Check /vendure/docs/docs/guides/how-to/ directory
   - Verify tutorial exists before proceeding
   ```

2. **Learning Outcomes Extraction**:
   - Create accurate list based on documentation content only
   - No speculation about features not covered
   - Use exact terminology from the documentation
   - Include only steps actually documented

### Step 2: Create Content Outline
```markdown
# [Working Title]

## Target Platform: [Platform Name]
## Standout Feature: [Unique Value Prop]
## Target Audience: [Developer/Business Role]
## Main Pain Point: [Business Problem]
## Documentation Source: [Actual Vendure doc URL/path]
## Verified Learning Outcomes: [List from documentation research]

### Section Outlines:
1. **Problem**: [Specific challenge]
2. **Solution**: [Platform's unique approach]  
3. **Vendure Advantage**: [Relevant architectural strength]
4. **CTA**: [Learning outcomes based on actual documentation]
```

### Step 3: Write Content Following Template
- Use the four-section structure exactly
- Apply tonality guidelines consistently
- Include platform-specific differentiators
- Reference ONLY actual Vendure features and APIs from documentation
- Maintain strict technical accuracy based on research

### Step 4: Accuracy Validation
**Content Validation:**
- [ ] Title follows the established formula
- [ ] Each section follows the structural pattern
- [ ] Platform's standout feature is clearly highlighted
- [ ] Vendure's architectural advantage is specific and accurate
- [ ] Learning outcomes are actionable and comprehensive
- [ ] Tonality matches the established voice
- [ ] Technical references are accurate
- [ ] Business benefits are clear and specific

**CRITICAL Accuracy Validation:**
- [ ] **Documentation research completed** before writing learning outcomes
- [ ] **Learning outcomes match actual tutorial content** - no hallucinations
- [ ] **Vendure APIs/functions mentioned** are actually covered in documentation
- [ ] **Tutorial scope accurately represented** - no overselling capabilities
- [ ] **Prerequisites and setup steps** align with actual documentation
- [ ] **All technical claims verified** against source documentation

**Consistency Check:**
- [ ] Matches the style of GitHub/Google/CloudFlare examples
- [ ] Professional but accessible language
- [ ] Confident and solution-oriented tone
- [ ] Specific rather than vague benefits
- [ ] Appropriate technical depth for audience

## 7. Output Requirements

### File Naming Convention
`[platform-name]-[integration-type]-[main-feature].md`

**Examples:**
- `cloudflare-r2-asset-storage.md`
- `stripe-payment-processing.md`
- `microsoft-oauth-authentication.md`
- `aws-s3-file-storage.md`

### File Location
Store in: `examples/[example-directory]/blogs/[filename].md`

### Content Validation
The final blog post must:
- Follow the exact four-section structure
- Highlight the platform's unique competitive advantage
- Position Vendure as the ideal integration platform
- Include specific, actionable learning outcomes
- Maintain consistent tonality with existing examples
- Be technically accurate and business-focused
- "Tease" the tutorial without providing implementation details

### Success Criteria
A successful blog post will:
- ✅ **Compel readers** to want to learn more about the integration
- ✅ **Differentiate the platform** from competitors clearly
- ✅ **Position Vendure** as the obvious implementation choice
- ✅ **Match established tonality** and structure patterns
- ✅ **Appeal to technical decision-makers** and senior developers
- ✅ **Drive traffic** to the actual tutorial documentation
- ✅ **Stand alone** as valuable content that showcases expertise

Remember: The goal is to create compelling marketing content that positions both the featured technology and Vendure as best-in-class solutions, driving readers to engage with the full tutorial implementation.

## CRITICAL SUCCESS REQUIREMENTS

**Accuracy is Non-Negotiable:**
- ALL learning outcomes must be based on actual Vendure documentation
- NO speculation about features, capabilities, or tutorial content
- MANDATORY documentation research before content creation
- Use ONLY terminology and APIs from verified sources

**Documentation Research Process:**
1. **Always read documentation first** - whether provided in arguments or found through search
2. **Extract exact steps and procedures** covered in the tutorial
3. **Note specific Vendure functions and APIs** mentioned
4. **Validate all technical claims** against source documentation
5. **Stick to actual tutorial scope** - don't oversell capabilities

This prevents hallucinations and ensures blog posts accurately represent what readers will actually learn from following the Vendure tutorials.