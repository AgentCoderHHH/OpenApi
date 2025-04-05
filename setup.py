from setuptools import setup, find_packages

setup(
    name="agentopenapi",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "flask>=2.0.0",
        "psutil>=5.9.0",
        "prometheus-client>=0.19.0",
        "loguru>=0.7.0",
    ],
    python_requires=">=3.8",
) 