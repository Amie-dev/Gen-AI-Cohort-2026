day 06
Vectorless RAG

in previous class we study about RAG with vector embadding
like how to data are store and in vectore storage and how to query



in today class we will descuss about problem in vector rag

main problem is abrupt chunking
in indexing data are store as indivisula chunks
in real worl example
that if you are store a book in vectore
that should store as a chunks 
here each chunck are indivisual
but main problem in real mening every paragraph have mening on chapter basic
in this case in vectore store as a chunk if not have chapter context this chuck either coorect or worng meaning





for solving this problem we used vectore less rag
page less index
add meta data
it work tree data structiucter

example of book
if index 
each index related to chater
chapter relater to sechip topic
each topic are related of paragrap

book --> page read llm --> root have two one is cdn and lb 
               lb have ele and stacky session
               cdn have

if i need stacky session
 every have metadata

page - root - lb -stacky session , this never read about cdn

there no need embading
all data are store in tree
cost is very high
but more accuracy
generated a table of content tree structure index of document
perform agentic resoning based retieval tree search



## What is PageIndex?

Are you frustrated with vector database retrieval accuracy for long and complex documents? Vector-based RAG retrieves by semantic **similarity**. But **similarity ≠ relevance** — what retrieval actually needs is relevance, and relevance requires **reasoning**. On professional documents that demand contextual understanding, domain expertise, and multi-step reasoning, similarity search misses what is relevant but not similar, and returns what is similar but not relevant.

Inspired by AlphaGo, **[PageIndex](https://vectify.ai/pageindex)** replaces the vector index with a **hierarchical tree index** and lets an LLM **reason** its way through it — the way a human expert flips to the right section of a long report. Retrieval happens in two steps:

1. **Index** — generate a **tree-structure index** for each document
2. **Retrieve** — retrieve information via LLM-based **tree search**


    <img src="https://docs.pageindex.ai/images/cookbook/vectorless-rag.png" width="70%">



### Compare with Vector RAG

| | Vector RAG | **PageIndex** |
|---|---|---|
| **Index** | vector index | tree index |
| **Unit** | fixed-size chunks | natural sections |
| **Retrieval** | semantic similarity search | LLM-based relevance search |
| **Result** | opaque, “vibe retrieval” | traceable to explicit references |
| **Context** | query embedding only | full context: conversation history, domain knowledge |

It is ideal for financial reports, legal documents, regulatory filings, technical manuals, medical literature, academic textbooks — any long, complex professional document.

leaarning LLM WIKI
what is andrej karpathy llm wiki

from this pageless vectore are come
llm make oun wiki

obsiden

you have multiple data sorueces
drive
pdf
web links
pandrive

background llm
llm create folder

in query
scanning all folder
scan releven file
scen each file titel , summery and matadat not full content
if file summery have relevent data then load content
https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f

in vectore rag you just push content
in vector less rag you not push content you update content


techonoloy is free to create 
but token is cost