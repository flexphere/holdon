<script>
	import {onMount} from 'svelte';

	let results = [];
	let searchText = "";
	let selectedClip= -1
	let input;
	const clips = window.holdon.history;

	clips.subscribe(function(data){
		search();
	})

	onMount(function(){
		input.focus();
	});

	function search() {
		results = searchText.length 
				? $clips.filter(c=>c.indexOf(searchText) !== -1) 
				: $clips.slice(0,10);
		selectedClip = -1
	}
	
	function select(e) {
		if (e.key =="ArrowDown" && selectedClip < results.length - 1) {
			input.blur();
			selectedClip++;
		}
		
		if (e.key =="ArrowUp" && selectedClip > -1) {
			input.blur();
			selectedClip--;
			if (selectedClip == -1) {
				input.focus();
			}
		}

		if ((e.key=='F' || e.key=='f') && e.ctrlKey) {
			e.preventDefault();
			e.stopPropagation();
			input.focus();
			return false;
		}

		if (e.key == 'Enter' && selectedClip != -1) {
			window.holdon.paste(results[selectedClip]);
		}

		if (e.key == 'Escape') {
			window.holdon.close();
		}
	}
</script>

<svelte:window on:keydown={select}/>

<div class="container">
	<input class="form-control" bind:this={input} bind:value={searchText} on:keyup={search}>

	{#each results as clip, i}
	<div class="card" class:selected={i == selectedClip}>
		{clip}
	</div>
	{/each}
</div>

