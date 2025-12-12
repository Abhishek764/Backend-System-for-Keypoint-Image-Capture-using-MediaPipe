#!/usr/bin/env python3
"""
MediaPipe Pose Keypoint Extraction Script
Extracts 33 body keypoints from an image using MediaPipe Pose
"""

import sys
import json
import cv2
import mediapipe as mp

def extract_keypoints(image_path):
    """
    Extract 33 body keypoints from an image using MediaPipe Pose
    
    Args:
        image_path: Path to the input image
        
    Returns:
        Dictionary containing keypoints data
    """
    try:
        # Initialize MediaPipe Pose
        mp_pose = mp.solutions.pose
        pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.5
        )
        
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image from {image_path}")
        
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process image
        results = pose.process(image_rgb)
        
        # Extract keypoints
        keypoints_data = {
            "landmarks": [],
            "visibility": [],
            "presence": []
        }
        
        if results.pose_landmarks:
            for landmark in results.pose_landmarks.landmark:
                keypoints_data["landmarks"].append({
                    "x": float(landmark.x),
                    "y": float(landmark.y),
                    "z": float(landmark.z)
                })
                keypoints_data["visibility"].append(float(landmark.visibility))
                keypoints_data["presence"].append(float(landmark.presence))
        else:
            # Return empty structure if no pose detected
            keypoints_data = {
                "landmarks": [{"x": 0.0, "y": 0.0, "z": 0.0} for _ in range(33)],
                "visibility": [0.0] * 33,
                "presence": [0.0] * 33
            }
        
        # Add metadata
        keypoints_data["image_path"] = image_path
        keypoints_data["detected"] = results.pose_landmarks is not None
        keypoints_data["total_keypoints"] = len(keypoints_data["landmarks"])
        
        return keypoints_data
        
    except Exception as e:
        error_data = {
            "error": str(e),
            "landmarks": [],
            "visibility": [],
            "presence": [],
            "detected": False,
            "total_keypoints": 0
        }
        return error_data
    finally:
        if 'pose' in locals():
            pose.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        error_response = {
            "error": "Image path required",
            "landmarks": [],
            "visibility": [],
            "presence": [],
            "detected": False,
            "total_keypoints": 0
        }
        print(json.dumps(error_response))
        sys.exit(1)
    
    image_path = sys.argv[1]
    keypoints = extract_keypoints(image_path)
    
    # Output JSON to stdout
    print(json.dumps(keypoints, indent=2))

