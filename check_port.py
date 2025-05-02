#!/usr/bin/env python3
"""
Port Checker and Process Killer

This script checks if a specified port is in use and optionally kills the process using it.
Usage:
    python check_port.py [port_number] [--kill]

Example:
    python check_port.py 5001 --kill
"""

import argparse
import os
import platform
import subprocess
import sys

def check_port_in_use(port):
    """Check if the specified port is in use."""
    system = platform.system().lower()
    
    try:
        if system == 'windows':
            # Windows command to check port
            result = subprocess.run(
                f'netstat -ano | findstr :{port}',
                shell=True,
                capture_output=True,
                text=True
            )
            if result.stdout.strip():
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    if f':{port}' in line:
                        parts = line.split()
                        if len(parts) >= 5:
                            pid = parts[-1]
                            return True, pid
            return False, None
            
        else:  # macOS or Linux
            # Unix command to check port
            result = subprocess.run(
                f'lsof -i :{port}',
                shell=True,
                capture_output=True,
                text=True
            )
            if result.stdout.strip():
                lines = result.stdout.strip().split('\n')
                if len(lines) > 1:  # Skip header line
                    parts = lines[1].split()
                    if len(parts) >= 2:
                        pid = parts[1]
                        return True, pid
            return False, None
            
    except Exception as e:
        print(f"Error checking port: {e}")
        return False, None

def kill_process(pid):
    """Kill the process with the specified PID."""
    system = platform.system().lower()
    
    try:
        if system == 'windows':
            # Windows command to kill process
            result = subprocess.run(
                f'taskkill /PID {pid} /F',
                shell=True,
                capture_output=True,
                text=True
            )
            return "successfully" in result.stdout.lower()
        else:
            # Unix command to kill process
            result = subprocess.run(
                f'kill -9 {pid}',
                shell=True,
                capture_output=True,
                text=True
            )
            return result.returncode == 0
            
    except Exception as e:
        print(f"Error killing process: {e}")
        return False

def get_process_info(pid):
    """Get information about the process with the specified PID."""
    system = platform.system().lower()
    
    try:
        if system == 'windows':
            # Windows command to get process info
            result = subprocess.run(
                f'tasklist /FI "PID eq {pid}"',
                shell=True,
                capture_output=True,
                text=True
            )
            return result.stdout.strip()
        else:
            # Unix command to get process info
            result = subprocess.run(
                f'ps -p {pid} -o pid,user,command',
                shell=True,
                capture_output=True,
                text=True
            )
            return result.stdout.strip()
            
    except Exception as e:
        print(f"Error getting process info: {e}")
        return "Unknown process"

def main():
    parser = argparse.ArgumentParser(description='Check if a port is in use and optionally kill the process.')
    parser.add_argument('port', type=int, nargs='?', default=5001, help='Port number to check (default: 5001)')
    parser.add_argument('--kill', action='store_true', help='Kill the process if port is in use')
    
    args = parser.parse_args()
    port = args.port
    
    print(f"Checking if port {port} is in use...")
    in_use, pid = check_port_in_use(port)
    
    if in_use:
        process_info = get_process_info(pid)
        print(f"Port {port} is in use by process with PID {pid}:")
        print(process_info)
        
        if args.kill:
            print(f"Attempting to kill process {pid}...")
            if kill_process(pid):
                print(f"Process {pid} successfully killed.")
                print(f"Port {port} should now be available.")
            else:
                print(f"Failed to kill process {pid}.")
                print("You may need to run this script with administrator privileges.")
        else:
            print(f"\nTo kill this process, run:")
            print(f"python check_port.py {port} --kill")
            
    else:
        print(f"Port {port} is not in use.")
        
if __name__ == "__main__":
    main()