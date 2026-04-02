---
title: "Principles and Data Analysis of fMRI"
date: 2024-02-15
tags: ["fMRI","neuroimaging","BOLD","SPM","FSL","data analysis","GLM","MVPA"]
author: "Erik Chang"
description: "A graduate course covering the physical principles of fMRI, experimental design, and data analysis pipelines including GLM, MVPA, and connectivity analysis."
summary: "Graduate course on fMRI: from MRI physics and BOLD signal to experimental design, preprocessing, GLM analysis, MVPA, and reproducibility best practices."
editPost:
    URL: "https://audachang.world/neuroimaging/new_wiki/"
    Text: "Lab wiki & analysis resources"
showToc: true
disableAnchoredHeadings: false
---

## Overview

This graduate course provides a thorough grounding in the principles and practice of functional MRI. Students gain hands-on experience with analysis pipelines (FSL, SPM, nilearn) and understand the statistical foundations of each step. The lab component uses real datasets from the ACL@NCU.

**Prerequisites:** Graduate standing; basic statistics and programming background helpful.

## Part 1: MRI Physics and the BOLD Signal

+ Proton magnetic resonance basics
+ Pulse sequences: EPI, gradient echo, spin echo
+ The BOLD signal: neural coupling, hemodynamic response function
+ Signal-to-noise and field strength considerations

##### Lab resources
+ [ACL fMRI Preprocessing Guide](https://audachang.world/neuroimaging/new_wiki/)
+ [PyMVPA installation](https://audachang.world/neuroimaging/new_wiki/index.php/Install_PyMVPA_Ubuntu)

## Part 2: Experimental Design

+ Block, event-related, and mixed designs
+ Design efficiency and counterbalancing
+ Sample size and power in neuroimaging
+ Pre-registration and registered reports

## Part 3: Preprocessing Pipeline

+ BIDS formatting and data organization
+ Slice-timing and motion correction
+ Spatial normalization to MNI space
+ Spatial smoothing and temporal filtering
+ fMRIPrep: a standardized preprocessing workflow

## Part 4: The General Linear Model

+ Design matrix construction and HRF convolution
+ Contrast specification and statistical maps
+ Multiple comparison correction (FWE, FDR, cluster-based)
+ Random effects and second-level analysis

## Part 5: Multivariate Pattern Analysis

+ The rationale for MVPA
+ Cross-validation schemes and bias avoidance
+ Searchlight analysis
+ Representational Similarity Analysis (RSA)

## Part 6: Connectivity and Advanced Methods

+ Seed-based functional connectivity
+ Psychophysiological interaction (PPI)
+ Dynamic causal modelling (DCM)
+ Resting-state ICA and dual regression

## Part 7: Reproducibility and Open Science

+ Data sharing: OpenNeuro, OSF
+ Code sharing and containerization (Docker, Singularity)
+ Effect size estimation in neuroimaging
+ Replication crisis and solutions
