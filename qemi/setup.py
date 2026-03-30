from setuptools import setup, find_packages

setup(
    name="ender-debugger",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "debugpy>=1.8.0",
        "websockets>=11.0.3",
        "psutil>=5.9.0",
        "pygments>=2.15.0",
        "watchdog>=3.0.0"
    ],
    python_requires=">=3.7",
) 