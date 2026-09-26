day 16
Claude skills evelopment & MCP

fundamental problem in mcp
context poisining
latency
tools executions-->scalabity problem
server side tool --statless


slountions is skill

skill= mcp + ..
claude skills 
     A soecacial capability

     package --- prompts
                 tools
                 code/script                 --internel public 
                 mcp server

                 zip file
                


npx skills add <skill>


building a payment gateway

pay-skill

doce
prompt
feature      ------------every context about this payment gateway
code/script
instructions

npx skills pay-skill


here load markdown file
but initialy this file content only metadata

base on need full file loaded from metadata

user exicuted all file on user machine




A skill is a set of instructions - packaged as a simple folder - that teaches Claude 
how to handle specific tasks or workflows. Skills are one of the most powerful 
ways to customize Claude for your specific needs. Instead of re-explaining your 
preferences, processes, and domain expertise in every conversation, skills let you 
teach Claude once and benefit every time. 


What is a skill?
A skill is a folder containing:
• SKILL.md (required): Instructions in Markdown with YAML frontmatter
• scripts/ (optional): Executable code (Python, Bash, etc.)
• references/ (optional): Documentation loaded as needed
• assets/ (optional): Templates, fonts, icons used in output



Technical requirements
File structure
your-skill-name/
├── SKILL.md # Required - main skill file
├── scripts/ # Optional - executable code
│ ├── process_data.py # Example
│ └── validate.sh # Example
├── references/ # Optional - documentation
│ ├── api-guide.md # Example
│ └── examples/ # Example
└── assets/ # Optional - templates, etc.
 └── report-template.md # Example
Critical rules
SKILL.md naming:
• Must be exactly SKILL.md (case-sensitive)
• No variations accepted (SKILL.MD, skill.md, etc.)
Skill folder naming:
• Use kebab-case: notion-project-setup ✅
• No spaces: Notion Project Setup ❌
• No underscores: notion_project_setup ❌
• No capitals: NotionProjectSetup ❌
No README.md:
• Don't include README.md inside your skill folder
• All documentation goes in SKILL.md or references/
• Note: when distributing via GitHub, you'll still want a repo-level README for 
human users — see Distribution and Sharing.
YAML frontmatter: The most important part
The YAML frontmatter is how Claude decides whether to load your skill. Get this 
right.
Minimal required format
---
name: your-skill-name
description: What it does. Use when user asks to [specific 
phrases].
---
That's all you need to start.
Field requirements
name (required):
• kebab-case only
• No spaces or capitals
• Should match folder name
description (required):
• MUST include BOTH:
– What the skill does
– When to use it (trigger conditions)
• Under 1024 characters
• No XML tags (< or >)
• Include specific tasks users might say
• Mention file types if relevant  wq                      1`



able to distrivuted
list marketplace
able add to mcpServer

