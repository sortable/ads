#!/usr/bin/env python

"""
This code adapts from the examples provided by the GoogleAds Python library
to add the specific targeting keys required by Sortable to provide analytics.
The LoadFromStorage method is pulling credentials and properties from a
"googleads.yaml" file. By default, it looks for this file in your home
directory. For more information, see the "Caching authentication information"
section of the googleads README at github.com/googleads/googleads-python-lib.
"""

import time
from googleads import dfp

# Number of values to send per request, and timeout between requests
# Play with these if you are being throttled. This will only
# try to add missing values, and will skip existing ones.
CHUNK_SIZE = 20
TIMEOUT = 0

# Our keys are typically prefixed to avoid conflicts with existing keys.
KEY_PREFIX = 'srt_'

# For base 36 encoding
ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz'

def get_or_create_key(custom_targeting_service, key_name):
    """ Get or create a Sortable Key Value with name key_name,
    reactivating it if it was deleted and returning its id """

    statement = (dfp.StatementBuilder()
                 .Where('name = :keyName')
                 .WithBindVariable('keyName', key_name)).ToStatement()
    response = custom_targeting_service.getCustomTargetingKeysByStatement(statement)

    if response.totalResultSetSize == 1:
        action = {'xsi_type': 'ActivateCustomTargetingKeys'}
        custom_targeting_service.performCustomTargetingKeyAction(action, statement)
        return response.results[0].id
    elif response.totalResultSetSize == 0:
        keys = custom_targeting_service.createCustomTargetingKeys(
            {'displayName': 'Sortable Key Value',
             'name': key_name,
             'type': 'PREDEFINED'})
        return keys[0].id
    else:
        raise Exception('Multiple keys found with name ' + key_name)


def get_values_for_key(custom_targeting_service, key_id):
    """ Based on the example get_predefined_custom_targeting_keys_and_values.py """
    # Get custom targeting keys by statement.
    # Create a statement to select custom targeting values.
    statement = (dfp.StatementBuilder()
                 .Where('customTargetingKeyId IN (:ids)')
                 .WithBindVariable('ids', [key_id]))

    # Retrieve a small amount of custom targeting values at a time, paging
    # through until all custom targeting values have been retrieved.
    values = []

    while True:
        response = custom_targeting_service.getCustomTargetingValuesByStatement(
            statement.ToStatement())
        if 'results' in response:
            values = values + [v['name'] for v in response['results'] if v['status'] == 'ACTIVE']
            statement.offset += statement.limit
        else:
            break

    print '\nNumber of results found: %s' % response['totalResultSetSize']
    return values


def throttled_create_values(custom_targeting_service, key_id, values, chunk_size):
    """ Send the keys to Google in chunks """
    chunk = []
    for i in range(0, len(values), chunk_size):
        j = min(i + chunk_size, len(values))
        chunk = [{'name': v, 'customTargetingKeyId': key_id} for v in values[i:j]]

        print "Adding values " + values[i] + " to " + values[j - 1]
        custom_targeting_service.createCustomTargetingValues(chunk)
        time.sleep(TIMEOUT)


def upsert_values(custom_targeting_service, key_id, values):
    """ Create the values on the existing key, if they aren't there yet """
    existing_values = get_values_for_key(custom_targeting_service, key_id)

    for value in existing_values:
        try:
            values.remove(value)
        except ValueError:
            print "Unexpected value " + value + " exists for this key. Continuing anyways."

    print "Need to create " + str(len(values)) + " values"
    throttled_create_values(custom_targeting_service, key_id, values, CHUNK_SIZE)


def base36encode(number):
    """ Convert a number to its base-36 string representations """
    base36 = ''

    while number:
        number, i = divmod(number, 36)
        base36 = ALPHABET[i] + base36

    return base36 or ALPHABET[0]


def add_sortable_keys():
    """ Adds all keys necessary for Sortable Analytics """

    # Initialize client object and custom targeting service.
    dfp_client = dfp.DfpClient.LoadFromStorage()
    service = dfp_client.GetService('CustomTargetingService', version='v201802')

    r = [KEY_PREFIX + 'r', [str(v) for v in range(2048)]]
    u = [KEY_PREFIX + 'u', [base36encode(v) for v in range(100000)]]
    u2 = [KEY_PREFIX + 'u2', [base36encode(v) for v in range(100000)]]
    u3 = [KEY_PREFIX + 'u3', [base36encode(v) for v in range(100000)]]
    u4 = [KEY_PREFIX + 'u4', [base36encode(v) for v in range(100000)]]
    u5 = [KEY_PREFIX + 'u5', [base36encode(v) for v in range(100000)]]

    for key_name, values in [r, u, u2, u3, u4, u5]:
        key_id = get_or_create_key(service, key_name)
        upsert_values(service, key_id, values)


if __name__ == '__main__':
    add_sortable_keys()

