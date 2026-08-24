day 07
Memory in AI Agent

applican level memory

start form starting

llm is nothing just api call
from applications post request
llm stateless


messages=[]
messages.push(user-message)
messages.push(llm-call(user-message))

problem is context window
limited
more context window
but stilled proble
badwidth
healusations
cost


short term memory
like slinding window memory

short term memory stor in db

wehen call llm 
table message
m= select text from messages order by time desc
limit 20
llm call(m+user-query)
now have previous context

here is problem

here have on call
like you just remeber last few message
but how to some fix value are alway remember like person name

also have long term memory
extractiong informations from short term memory and stor in logterm memory



post/chat
{query}
stm=load-19-mess
llmcall(stm_query)
extract-memory(userquery)-->llm call --> userquey , extract key informations from this query if its there -->LTM Extract  store

now 
llm-call(stm + ltm + query)


over time ltm is growing


proble user just say hey

problem is load ltm + stm + quey
more token
its problem

ltm=serch-ltm(query) used vectore  db

ltm search as key like perform rag

llm call(stm+rag vector seach+query)

in ltm user vector insert
setrve semitric search

problem statement
typical sd problem --> latency, storage ,

magic problem --> eviction policy

apply eviction policy in ltm

ltm |--> fatcs like name,dob, like -->string --> store in vector embeding vector db
    |--> Episodic like some kind of event -->with time seric data --> patterns or personalization this stor vector embeding + timewindow seach
                    its immutable
                    append only log

Episodic memoery alos add fact call dreaming
Dreams
Let Claude reflect on past sessions to curate an agent's memory and surface new insights.
Dreaming is a research preview feature. Request access to try it.

Agents write to their memory stores as they work, but these writes are local and incremental: over many sessions a memory store accumulates duplicates, contradictions, and stale entries.

Dreams let Claude clean that up. A dream reads an existing memory store alongside past session transcripts, then produces a new, reorganized memory store: duplicates merged, stale or contradicted entries replaced with the latest value, and new insights surfaced.

The input store is never modified, so you can review the output and discard it if you don't like the result.

here also graph db
neo4j

now problem is latency

api server
llm proxy
eagerloading
memory load

add hit-score is change evry call
prefatching of the memory

simple search
agentic seacrch --> loop engenering

sdk mem0


how to solved

