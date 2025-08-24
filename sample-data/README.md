# Sample Call Transcripts and Expected Analysis

This directory contains sample call data for testing the OMIND.AI Contact Center Analysis Platform.

## Sample Call 1: Excellent Customer Service

**File**: `excellent-customer-service.txt`
**Scenario**: Agent handles a billing inquiry with excellent customer service
**Expected Scores**:
- Call Opening: 95/100
- Issue Understanding: 90/100
- Sentiment: Positive/Positive
- CSAT: 5/5
- Resolution Quality: 95/100

## Sample Call 2: Poor Customer Service

**File**: `poor-customer-service.txt`
**Scenario**: Agent fails to properly address customer concerns
**Expected Scores**:
- Call Opening: 40/100
- Issue Understanding: 30/100
- Sentiment: Negative/Negative
- CSAT: 2/5
- Resolution Quality: 25/100

## Sample Call 3: Technical Support

**File**: `technical-support.txt`
**Scenario**: Agent helps customer with technical issue
**Expected Scores**:
- Call Opening: 80/100
- Issue Understanding: 85/100
- Sentiment: Neutral/Positive
- CSAT: 4/5
- Resolution Quality: 90/100

## Usage

These sample transcripts can be used to test the AI analysis pipeline without needing actual audio files. The system will accept text files for demo purposes and process them through the same analysis workflow.
