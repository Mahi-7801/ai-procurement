"""
RTGS AI-Procurement Batch Processing Utility
PoC Tool for processing 100+ cases as per requirement.
"""
import os
import json
import asyncio
import time
from pathlib import Path
import random

# Mocking some parts of the backend for standalone execution
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from routers.ai_validator import extract_text_from_pdf, get_local_analysis, load_rules

class BatchProcessor:
    def __init__(self, input_dir="uploads/bids", output_file="batch_results.json"):
        self.input_dir = Path(input_dir)
        self.output_file = output_file
        self.results = []
        os.makedirs(self.input_dir, exist_ok=True)

    def generate_mock_cases(self, count=100):
        """Generates mock tender metadata for the PoC simulation"""
        categories = ["IT Equipment", "Furniture", "Civil Works", "Medical Supplies", "Vehicles"]
        departments = ["RTGS", "Education", "Health", "Agriculture", "Infrastructure"]
        
        cases = []
        for i in range(1, count + 1):
            cases.append({
                "tender_id": f"AP-TENDER-2026-{i:03d}",
                "project_name": f"Procurement of {random.choice(categories)} for {random.choice(departments)}",
                "estimatedValue": random.randint(50000, 5000000),
                "category": random.choice(categories),
                "emdRequired": random.choice(["Yes", "No"]),
                "quantity": random.randint(1, 1000)
            })
        return cases

    async def process_all(self, limit=100):
        print(f"🚀 Starting Batch Processing for {limit} cases...")
        start_time = time.time()
        
        # Get actual files if any
        pdf_files = list(self.input_dir.glob("*.pdf"))
        mock_cases = self.generate_mock_cases(limit)
        
        for i, case in enumerate(mock_cases):
            # Simulate PDF content if no actual file available
            extracted_text = ""
            if i < len(pdf_files):
                extracted_text = extract_text_from_pdf(str(pdf_files[i]))
            else:
                # Simulated text snippet for PoC
                extracted_text = f"Technical specifications for {case['project_name']}. Requirement: {case['category']}. Total quantity: {case['quantity']} units."
            
            context = {
                "tender_data": case,
                "extracted_text_snippet": extracted_text[:5000]
            }
            
            # Using the local analysis engine for high-speed batch processing
            # In a real run with API keys, we would call the Claude/Gemini path
            analysis = get_local_analysis(context)
            
            avg_score = sum(item.get("score", 0) for item in analysis) / len(analysis) if analysis else 0
            
            result = {
                "tender_id": case["tender_id"],
                "project_name": case["project_name"],
                "score": round(avg_score, 2),
                "issues_count": len([i for i in analysis if i["status"] != "pass"]),
                "processed_at": time.strftime("%Y-%m-%d %H:%M:%S")
            }
            
            self.results.append(result)
            
            if (i + 1) % 10 == 0:
                print(f"✅ Processed {i + 1}/{limit} cases...")
            
            # Artificial delay to simulate AI processing time if it were a real network call
            # await asyncio.sleep(0.1)

        end_time = time.time()
        duration = end_time - start_time
        
        summary = {
            "total_processed": len(self.results),
            "avg_compliance_score": round(sum(r["score"] for r in self.results) / len(self.results), 2),
            "total_issues_found": sum(r["issues_count"] for r in self.results),
            "execution_time_seconds": round(duration, 2),
            "cases": self.results
        }
        
        with open(self.output_file, "w") as f:
            json.dump(summary, f, indent=2)
            
        print(f"\n✨ Batch Processing Complete!")
        print(f"📊 Total Cases: {len(self.results)}")
        print(f"⏱️ Time Taken: {round(duration, 2)}s")
        print(f"📂 Results saved to: {self.output_file}")
        return summary

if __name__ == "__main__":
    processor = BatchProcessor(output_file="POC_BATCH_VALIDATION_RESULTS.json")
    asyncio.run(processor.process_all(100))
