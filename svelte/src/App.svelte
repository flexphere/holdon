<script>
	import {onMount} from 'svelte';
	import {writable} from 'svelte/store';

	if (location.hash == "#dev") {
		window.holdon = {
			history: writable(['abc', 'd<div>ef</div>', 'ghi','abc', 'def', 'ghi','abc', 'def', 'ghi']),
			paste: () => {},
			close: () => {},
			delete: () => {},
		};
	}

	let results = [];
	let searchText = "";
	let selectedClip= -1
	let input;
	let cards;
	let regex = null;

	const clips = window.holdon.history;

	clips.subscribe(function(data){
		search();
	})

	onMount(function(){
		input.focus();
	});

	function search() {
		if (searchText.trim() === "-img") {
			results = $clips.filter(c=>c.type === "image") 
		}
		else if (searchText.trim().length) {
			regex = new RegExp(searchText, 'ig');
			results = $clips.filter(c=>c.type === "text" && c.data.match(regex)) 
		} else {
			regex = null;
			results = $clips.slice(0,25);
		}
		// results = searchText.length 
		// 		? $clips.filter(c=>c.indexOf(searchText) !== -1) 
		// 		: $clips.slice(0,10);
		selectedClip = -1;
	}

	function keyboardListener(e) {
		if (e.key =="ArrowDown" && selectedClip < results.length - 1) {
			input.blur();
			selectedClip++;
			cards.children[selectedClip].scrollIntoView({block:"center"});
		}
		
		if (e.key =="ArrowUp" && selectedClip > -1) {
			input.blur();
			selectedClip--;
			if (selectedClip == -1) {
				input.focus();
			} else {
				cards.children[selectedClip].scrollIntoView({block:"center"});
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

	function itemHover(e) {
		selectedClip = e.target.dataset.id;
	}

	function itemClick(e) {
		window.holdon.paste(results[e.target.parentElement.dataset.id]);
	}

	function itemDelete(e) {
		e.preventDefault();
		e.stopPropagation();
		window.holdon.delete(results[e.target.parentElement.dataset.id]);
	}

	function sanitize(clip) {
		if (regex) {
			return clip.data
				.slice(0,256)
				.replace(/</g,'&lt;')
				.replace(/>/g,'&gt;')
				.replace(regex, "<span>$&</span>")
		} else {
			return clip.data.slice(0,256)
		}
	}
</script>

<svelte:window on:keydown={keyboardListener}/>

<div class="container">
	<div class="search">
		<input class="form-control" bind:this={input} bind:value={searchText} on:keyup={search} placeholder="Search...">
	</div>
	<div class="cards" bind:this={cards}>
		{#each results as clip, i}
		<div class="card" class:selected={i == selectedClip} data-id={i} on:mouseenter={itemHover} on:click={itemClick}>
			{#if clip.type == "text"}
				{#if regex}
				<div class="clip">{@html sanitize(clip)}</div>
				{:else}
				<div class="clip">{sanitize(clip)}</div>
				{/if}
			{/if}
			{#if clip.type == "image"}
				<div class="clip">
					<div class="time">{(new Date(clip.time)).toLocaleString()}</div>
					<div class="image">
						<img src={clip.data} alt="">
					</div>
				</div>
			{/if}
			<div class="delete" on:click={itemDelete}>x</div>
		</div>
		{/each}
	</div>
</div>