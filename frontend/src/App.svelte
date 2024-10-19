<script lang="ts">
    import { WebSocketHandler } from "lib/websocket";
    const ws = new WebSocketHandler("ws://localhost:8080/search");

    let suggestions: string[] = [];
    let searchTerm = "";
    let showSuggestions = false;

    ws.register("SearchResults", (msgs) => {
        suggestions = msgs;
        showSuggestions = msgs.length > 0;
    });

    const PLACEHOLDER = [
        "Taylor Swift - Blank Space",
        "Natasha Bedingfield - Unwritten",
        "Swiss & die Anderen - Linksradikaler Schlager",
        "Franz Ferdinand - Take Me Out",
    ];

    function randomPlaceholder() {
        return PLACEHOLDER[Math.floor(Math.random() * PLACEHOLDER.length)];
    }

    function updateSuggestions() {
        if (searchTerm.length > 0) {
            ws.send({ Search: searchTerm });
        } else {
            showSuggestions = false;
        }
    }

    function selectSuggestion(suggestion: string) {
        searchTerm = suggestion;
        showSuggestions = false;
    }
</script>

<div class="flex justify-center items-center min-h-screen bg-gray-100">
    <div class="w-full max-w-md">
        <div class="relative">
            <input
                type="text"
                bind:value={searchTerm}
                on:input={updateSuggestions}
                on:keydown={(e) =>
                    e.key === "Enter" && selectSuggestion(suggestions[0])}
                placeholder={randomPlaceholder()}
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {#if showSuggestions}
                <ul
                    class="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-auto"
                >
                    {#each suggestions as suggestion}
                        <li>
                            <button
                                on:click={() => selectSuggestion(suggestion)}
                                class="w-full text-left px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            >
                                {suggestion["name"]}
                            </button>
                        </li>
                    {/each}
                </ul>
            {/if}
        </div>
    </div>
</div>
