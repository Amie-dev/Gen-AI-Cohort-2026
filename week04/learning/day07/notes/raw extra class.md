day 07
Memory in AI Agent


extra if you went to learn
  why memory 

start with why memory is expensive
heardware also in llm side
it fast
ram is costly
how can it access or retrive , randomly acces memory
in gpu 

every one buy gpu , ram  or othe rbut they are not able to utlizee optimize way

traning phase         inference
adjustable weight     fix weight

gpu user more in inference

in traning in one time used of gpu

inference used gpu regulure or each call or query

for use of inference phase
used inference engine
inference engine is responsiable for surb ai

about inference engine
provided queue ,dynamic batching,kv caches management
inference engine is like engineex


without inference engine you not able to optimize open weight model
vLLM is an inference engine



user --> llm on gpu

 lmm is two part prefil and decode

 quey --> vectore --> llm -->next word predictions
 fast time quey is called prefil
 load in gpu vram


 here kv are attentions head
in prefile need more gpu hight bendweight
 all done in prefil stage encode

 in decode satge

set a leyer of llm , perfile, decode --with  inference engine this optimize all so surb multiple user

also need cpu serv web requet  call
cpu to to llm need other inference engine 
need very optimize cod ein server


about
vLLM is a fast and easy-to-use library for LLM inference and serving.

Originally developed in the Sky Computing Lab at UC Berkeley, vLLM has grown into one of the most active open-source AI projects built and maintained by a diverse community of many dozens of academic institutions and companies from over 2000 contributors.

vLLM is fast with:

State-of-the-art serving throughput
Efficient management of attention key and value memory with PagedAttention
Continuous batching of incoming requests, chunked prefill, prefix caching
Fast and flexible model execution with piecewise and full CUDA/HIP graphs
Quantization: FP8, MXFP8/MXFP4, NVFP4, INT8, INT4, GPTQ/AWQ, GGUF, compressed-tensors, ModelOpt, TorchAO, and more
Optimized attention kernels including FlashAttention, FlashInfer, TRTLLM-GEN, FlashMLA, and Triton
Optimized GEMM/MoE kernels for various precisions using CUTLASS, TRTLLM-GEN, CuTeDSL
Speculative decoding including n-gram, suffix, EAGLE, DFlash
Automatic kernel generation and graph-level transformations using torch.compile
Disaggregated prefill, decode, and encode
vLLM is flexible and easy to use with:

Seamless integration with popular Hugging Face models
High-throughput serving with various decoding algorithms, including parallel sampling, beam search, and more
Tensor, pipeline, data, expert, and context parallelism for distributed inference
Streaming outputs
Generation of structured outputs using xgrammar or guidance
Tool calling and reasoning parsers
OpenAI-compatible API server, plus Anthropic Messages API and gRPC support
Efficient multi-LoRA support for dense and MoE layers
Support for NVIDIA GPUs, AMD GPUs, Intel GPUs, and x86/ARM/PowerPC CPUs. Additionally, diverse hardware plugins such as Google TPUs, Intel Gaudi, IBM Spyre, Huawei Ascend, Rebellions NPU, Apple Silicon, MetaX GPU, and more.
vLLM seamlessly supports 200+ model architectures on Hugging Face, including:

Decoder-only LLMs (e.g., Llama, Qwen, Gemma)
Mixture-of-Expert LLMs (e.g., Mixtral, DeepSeek-V3, Qwen-MoE, GPT-OSS)
Hybrid attention and state-space models (e.g., Mamba, Qwen3.5)
Multi-modal models (e.g., LLaVA, Qwen-VL, Pixtral)
Embedding and retrieval models (e.g., E5-Mistral, GTE, ColBERT)
Reward and classification models (e.g., Qwen-Math)
Find the full list of supported models here.




