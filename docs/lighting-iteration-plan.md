# STRNK Lighting Iteration Plan

Use this as the lighting work plan for the Three.js scene.

The target is a **dark cinematic studio look**: the mascot should remain predominantly charcoal / near-black, with form revealed by a soft neutral key, minimal fill, a strong warm rim light, grounded contact shadows, and subtle background separation.

## Core rule

> Do not make the scene brighter to make it more readable. Improve light placement and tonal separation instead.

Work through the steps in order. Change **one lighting subsystem per iteration** and stop for a render/review before continuing.

---

## 1. Establish the dark baseline

### Agent prompt

> Match the concept's base darkness. Disable orange/rim lighting, bloom, AO and unnecessary ambient lighting. Keep only one neutral key. Adjust only renderer tone mapping, exposure and the mascot's base material value. The mascot should read as dark charcoal / charred wood rather than tan or beige. Do not change light placement yet. Render one screenshot at the existing camera and viewport, then stop.

### Reviewer checklist

Approve when:

- the mascot reads as dark charcoal / charred wood
- major trunk grooves and limb shapes are still visible
- the mascot feels part of the dark scene
- the body does not compete in brightness with the white typography

Reject if:

- the mascot looks beige or tan
- large areas are crushed completely to black
- readability depends on high exposure

---

## 2. Sculpt the form with the key light

### Agent prompt

> Keep exposure and materials unchanged. Adjust only the neutral key light's position, size and orientation. Use a large soft source above and camera-left so the low-poly facets create alternating light and shadow. Do not add fill or orange light. Render one screenshot and stop.

Treat the exact values as scene-dependent.

### Reviewer checklist

Focus on:

- vertical trunk grooves
- forearms
- shoulders
- major root planes

Approve when:

- adjacent facets clearly differ in brightness
- the mascot feels sculpted rather than evenly lit
- the key direction is obvious without looking harsh

Reject if:

- the entire front has roughly the same brightness
- the key behaves like a frontal camera light
- the agent solves shape readability by increasing intensity instead of changing placement

---

## 3. Add only the minimum required fill

### Agent prompt

> Keep the approved key unchanged. Remove ambient/environment fill, then add back only the minimum fill required to retain information in deep shadows. Do not brighten the overall mascot and do not introduce another obvious lighting direction. Render one screenshot and stop.

### Reviewer checklist

Check:

- inside the fists
- undersides of the arms
- root creases
- the dark side of the trunk

Approve when:

- these regions are very dark but still understandable
- the key remains the dominant lighting direction

Reject if:

- shadows turn grey everywhere
- the scene starts looking evenly lit again
- the fill creates its own obvious highlight direction

---

## 4. Make the floor disappear into the scene

### Agent prompt

> Keep the approved character lighting unchanged. Adjust only the ground plane. Make it much larger, nearly black, rough and visually continuous with the page/background. Remove any visible rectangular floor boundary. Do not change character lights. Render one screenshot and stop.

### Reviewer checklist

Approve when:

- you cannot identify the plane edges
- the floor is visible mainly where light reveals it
- there is no obvious brown rectangle beneath the mascot

Reject if:

- the floor reads as a separate platform
- the plane boundary is visible against the background

---

## 5. Build the orange rim light in isolation

### Agent prompt

> Temporarily disable the neutral key. Add/tune only a warm orange rear-right rim light. The goal is a thin coherent silhouette highlight along the right fist, outer arm, trunk and roots. Avoid orange illumination on broad front-facing surfaces. Change placement before intensity if the rim appears as random patches. Render one screenshot with the key still disabled, then stop.

Treat the power as scene-scale dependent.

### Reviewer checklist

Look for a coherent rim on:

- right fist
- outer forearm
- shoulder edge
- trunk silhouette
- right-side roots

Approve when:

- the mascot is partly recognizable from the orange edge alone
- the rim follows the silhouette continuously

Reject if:

- broad front-facing polygons turn orange
- orange appears as random red patches in creases
- it behaves like general warm fill instead of backlight

---

## 6. Combine the key and rim

### Agent prompt

> Re-enable the approved neutral key. Do not reposition either light. Adjust only the relative intensities of key and rim so the mascot remains mostly charcoal while the orange rim is one of the brightest character features. Render one screenshot and stop.

Desired hierarchy:

```text
brightest
  orange rim
  selective neutral highlights
  graphite / charcoal planes
  deep near-black creases
darkest
```

### Reviewer checklist

Approve when:

- the body remains predominantly charcoal
- the rim clearly separates the silhouette
- the neutral key describes the main form
- orange does not contaminate the whole model

Reject if the result reads as:

```text
light brown mascot
+ orange accent
```

The target is:

```text
dark mascot
+ selective neutral modelling
+ bright orange separation
```

---

## 7. Add contact shadows and ambient occlusion

### Agent prompt

> Keep the approved key/rim ratio unchanged. Add only grounding: a subtle shadow-casting light and restrained GTAO/SSAO. Concentrate the effect around root-floor contact, overlapping roots, arm/trunk joints and fist creases. Do not use AO to darken the whole mascot. Render one screenshot and stop.

### Reviewer checklist

Approve when:

- the roots feel heavy and planted
- overlapping forms gain local depth
- AO is noticeable mainly at contact points

Reject if:

- every polygon gets a dark outline
- the mascot looks dirty
- the whole scene becomes globally darker

---

## 8. Add subtle background separation

### Agent prompt

> Keep all approved mascot lighting unchanged. Add only a very subtle dark background gradient/halo behind the mascot so the silhouette separates from the near-black page. Keep the corners almost black. It must not look like a visible spotlight. Render one screenshot and stop.

A physical backdrop plane is also acceptable if preferred.

### Reviewer checklist

Toggle it off/on.

Approve when:

- the dark-side silhouette reads more clearly
- the page still looks black at first glance
- the background treatment is felt more than seen

Reject if:

- there is an obvious halo
- it looks like a spotlight behind the mascot
- it changes the overall composition too strongly

---

## 9. Refine material response

### Agent prompt

> Keep all approved lighting fixed. Improve only the bark material response. Add subtle dark value variation and roughness variation so grooves and facets respond more richly to grazing light. Preserve the charcoal / charred-wood appearance. Avoid visible noise or obvious procedural texture. Render one screenshot and stop.

### Reviewer checklist

Approve when:

- the material looks richer under grazing light
- grooves and ridges respond differently
- variation is subtle at normal viewing distance

Reject if:

- the surface looks noisy or mottled
- the material looks procedural
- the bark becomes plastic-looking

---

## 10. Add bloom last

### Agent prompt

> Keep all approved lighting and materials unchanged. Add minimal bloom only to the hottest orange highlights. Use a high threshold, low strength and small radius. The rim must remain fully visible with bloom disabled. Render one screenshot with bloom enabled and one with bloom disabled, then stop.

### Reviewer checklist

Approve when:

- the rim still works perfectly with bloom off
- bloom adds only a few pixels of photographic glow
- the hottest orange areas receive the effect

Reject if:

- dark surfaces glow
- there is orange haze over the whole scene
- bloom is doing the work that the rim light should be doing

---

# Iteration rules for the agent

1. Change only one lighting subsystem per iteration.
2. Do not compensate for incorrect light placement with exposure, AO, bloom or material changes.
3. Preserve approved settings unless explicitly asked to revisit them.
4. Render at the exact same camera and viewport every time.
5. Compare against the concept after every iteration.
6. Stop after each requested step unless explicitly told to continue.
7. Prefer repositioning a light over increasing its power when the direction is wrong.
8. Keep the mascot predominantly dark throughout the process.
9. Avoid adding extra lights unless the current step specifically requires them.
10. Do not alter camera, geometry, UI layout or composition while working through this plan.

## Standard instruction to append to each task

> After making this change, render one screenshot at the exact existing camera and viewport. Do not alter unrelated lighting, materials, camera, geometry, UI, or post-processing. Stop after this iteration so it can be reviewed before proceeding.
