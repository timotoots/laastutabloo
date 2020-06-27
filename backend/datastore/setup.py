from setuptools import find_packages, setup



setup(
    name='laastutabloo.datastore',
    version='0.0.1',
    url='https://laastutabloo.eu/',
    author='Timo Toots',
    author_email='timo@timo.ee',
    description=('Laastutabloo backend.'),
    packages=find_packages("."),
#    packages=['laastutabloo'],
    include_package_data=True,
    entry_points={'console_scripts': [
        'datastore = datastore:execute_from_command_line',
    ]},
    install_requires=['pytz', 'sqlparse', 'flask_cors', 'flask', 'flask_restful_swagger_2', 'scrapyd-client', 'json_schema_generator',
                      'xmltodict', 'geoalchemy2', 'geomet', 'shapely', 'pyshp', 'pyproj'],    
    extras_require={
        "bcrypt": ["bcrypt"],
        "argon2": ["argon2-cffi >= 16.1.0"],
    },
    zip_safe=False,
    classifiers=[
        'Development Status :: 2 - Pre-Alpha',
    ],
    project_urls={
        'Source': 'https://github.com/timotoots/laastutabloo',
    },
)

