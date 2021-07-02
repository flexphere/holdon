<script>
	import {onMount} from 'svelte';
	import {writable} from 'svelte/store';

	if (location.hash == "#dev") {
		window.holdon = {
			reset: writable(0),
			history: writable([
				{text:'abc', pasteOptions:["text"], pasteAs:0},
			 	{text:'def', html:'d<div>ef</div>', pasteOptions:["html","text"], pasteAs:1},
			 	{text:'ghi', rtf:"GHI RichText", pasteOptions:["text", "rtf"], pasteAs:1},
				{text:'ijk', html:'i<div>jk</div>', rtf:"GHI RichText", pasteOptions:["html", "text", "rtf"], pasteAs:2},
				{image:'abc', time:(new Date).getTime(), pasteOptions:["image"], pasteAs:0},
				{text:'abc', pasteOptions:["text"], pasteAs:0},
			 	{text:'def', html:'d<div>ef</div>', pasteOptions:["html","text"], pasteAs:1},
			 	{text:'ghi', rtf:"GHI RichText", pasteOptions:["text", "rtf"], pasteAs:1},
				{text:'ijk', html:'i<div>jk</div>', rtf:"GHI RichText", pasteOptions:["html", "text", "rtf"], pasteAs:2},
				{image:'abc', time:(new Date).getTime(), pasteOptions:["image"], pasteAs:0},
				{text:'abc', pasteOptions:["text"], pasteAs:0},
			 	{text:'def', html:'d<div>ef</div>', pasteOptions:["html","text"], pasteAs:1},
			 	{text:'ghi', rtf:"GHI RichText", pasteOptions:["text", "rtf"], pasteAs:1},
				{text:'ijk', html:'i<div>jk</div>', rtf:"GHI RichText", pasteOptions:["html", "text", "rtf"], pasteAs:2},
				{image:'abc', time:(new Date).getTime(), pasteOptions:["image"], pasteAs:0},
				{text:'abc', pasteOptions:["text"], pasteAs:0},
			 	{text:'def', html:'d<div>ef</div>', pasteOptions:["html","text"], pasteAs:1},
			 	{text:'ghi', rtf:"GHI RichText", pasteOptions:["text", "rtf"], pasteAs:1},
				{text:'ijk', html:'i<div>jk</div>', rtf:"GHI RichText", pasteOptions:["html", "text", "rtf"], pasteAs:2},
				{image:'abc', time:(new Date).getTime(), pasteOptions:["image"], pasteAs:0},
			]),
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

	const resetEvent = window.holdon.reset;
	resetEvent.subscribe(function(data){
		searchText = "";
		search();
	})

	onMount(function(){
		input.focus();
	});

	function search() {
		if (searchText.trim() === "-img") {
			results = $clips.filter(c=>c.image) 
		}
		else if (searchText.trim().length) {
			regex = new RegExp(searchText, 'ig');
			results = $clips.filter(c=>c.text.match(regex))
		} else {
			regex = null;
			results = $clips.slice(0,25);
		}
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

		if (e.key =="ArrowRight" && selectedClip > -1) {
			nextPasteOption(e);
		}

		if (e.key =="ArrowLeft" && selectedClip > -1) {
			prevPasteOption(e);
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

	function nextPasteOption(e) {
		e.preventDefault();
		e.stopPropagation();
		if (selectedClip == -1) {
			return;
		}
		const maxIndex = results[selectedClip].pasteOptions.length - 1;
		
		if (results[selectedClip].pasteAs >= maxIndex) {
			results[selectedClip].pasteAs = 0;
		} else {
			results[selectedClip].pasteAs += 1;
		}
	}

	function prevPasteOption(e) {
		e.preventDefault();
		e.stopPropagation();
		if (selectedClip == -1) {
			return;
		}
		const maxIndex = results[selectedClip].pasteOptions.length - 1;
		if (results[selectedClip].pasteAs <= 0) {
			results[selectedClip].pasteAs = maxIndex;
		} else {
			results[selectedClip].pasteAs -= 1;
		}
	}

	function itemHover(e) {
		selectedClip = e.target.dataset.id;
	}

	function itemClick(e) {
		const el = e.target.classList.contains('card') ? e.target : e.target.closest('.card');
		window.holdon.paste(results[el.dataset.id]);
	}

	function itemDelete(e) {
		e.preventDefault();
		e.stopPropagation();
		window.holdon.delete(results[e.target.parentElement.dataset.id]);
	}

	function sanitize(clip) {
		if (regex) {
			return clip.text
				.slice(0,256)
				.replace(/</g,'&lt;')
				.replace(/>/g,'&gt;')
				.replace(regex, "<span>$&</span>")
		} else {
			return clip.text.slice(0,256)
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
			{#if clip.image}
			<div class="clip">
				<div class="time">{(new Date(clip.time)).toLocaleString()}</div>
				<div class="image">
					<img src={clip.image} alt="">
				</div>
			</div>
			{:else}
				{#if regex}
				<div class="clip">{@html sanitize(clip)}</div>
				{:else}
				<div class="clip">{sanitize(clip)}</div>
				{/if}
			{/if}

			{#if clip.pasteOptions.length > 1}
			<div class="pasteOption" on:click={nextPasteOption}>
				{clip.pasteOptions[clip.pasteAs].toUpperCase()}
			</div>
			{/if}

			<div class="delete" on:click={itemDelete}>x</div>
		</div>
		{/each}
	</div>
</div>