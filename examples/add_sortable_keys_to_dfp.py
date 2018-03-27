#!/usr/bin/env python

"""
This code adapts examples provided by the GoogleAds Python library.
It adds the specific targeting keys required by Sortable to provide analytics.
The LoadFromStorage method is pulling credentials and properties from a
"googleads.yaml" file. By default, it looks for this file in your home
directory. For more information, see the "Caching authentication information"
section of the googleads README at github.com/googleads/googleads-python-lib.
"""

import string
import time
from itertools import islice
from googleads import dfp

# Number of values to send per request, and timeout between requests
# Play with these if you are being throttled or think it could go faster.
CHUNK_SIZE = 1000
TIMEOUT = 0

# Our keys are typically prefixed to avoid conflicts with existing keys.
KEY_PREFIX = 'srt_'

# For base 36 encoding
BASE36_ALPHABET = string.digits + string.ascii_lowercase

def get_or_create_key(custom_targeting_service, key_name):
    """ Get or create a Sortable Key Value with name key_name,
    reactivating it if it was deleted and returning its id
    """
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
    statement = (dfp.StatementBuilder()
                 .Where('customTargetingKeyId IN (:ids) AND status=\'ACTIVE\'')
                 .WithBindVariable('ids', [key_id]))

    # Retrieve a small number of custom targeting values at a time, paging
    # through until all custom targeting values have been retrieved.
    values = []

    while True:
        response = custom_targeting_service.getCustomTargetingValuesByStatement(
            statement.ToStatement())
        if 'results' in response:
            values.extend(v['name'] for v in response['results'])
            statement.offset += statement.limit
        else:
            break

    print '\nNumber of results found: {}'.format(response['totalResultSetSize'])
    return values


def throttled_create_values(custom_targeting_service, key_id, values):
    """ Send the keys to Google in chunks """
    for i in xrange(0, len(values), CHUNK_SIZE):
        chunk = [{'name': v, 'customTargetingKeyId': key_id} for v in islice(values, i, i + CHUNK_SIZE)]
        print 'Adding values {} to {}'.format(values[i], values[i + CHUNK_SIZE - 1])
        custom_targeting_service.createCustomTargetingValues(chunk)
        time.sleep(TIMEOUT)


def upsert_key_values(custom_targeting_service, key_name, values):
    """ Create the values on the existing key, if they aren't there yet """
    print 'Processing key {}'.format(key_name)
    key_id = get_or_create_key(custom_targeting_service, key_name)
    existing_values = get_values_for_key(custom_targeting_service, key_id)

    for value in existing_values:
        try:
            values.remove(value)
        except ValueError:
            print 'Unexpected value {} exists for this key. Continuing anyways.'.format(value)

    print 'Need to create {} values'.format(len(values))
    throttled_create_values(custom_targeting_service, key_id, values)


def base36encode(number):
    """ Convert a number to its base-36 string representations """
    base36 = ''

    while number:
        number, i = divmod(number, 36)
        base36 = BASE36_ALPHABET[i] + base36

    return base36 or BASE36_ALPHABET[0]


def add_sortable_keys():
    """ Adds all keys necessary for Sortable Analytics """
    # Initialize client object and custom targeting service.
    dfp_client = dfp.DfpClient.LoadFromStorage()
    service = dfp_client.GetService('CustomTargetingService', version='v201802')

    key_value_pairs = [[KEY_PREFIX + 'r', [str(v) for v in xrange(2048)]],
                       [KEY_PREFIX + 'u', [base36encode(v) for v in xrange(100000)]],
                       [KEY_PREFIX + 'u2', [base36encode(v) for v in xrange(100000)]],
                       [KEY_PREFIX + 'u3', [base36encode(v) for v in xrange(100000)]],
                       [KEY_PREFIX + 'u4', [base36encode(v) for v in xrange(100000)]],
                       [KEY_PREFIX + 'u5', [base36encode(v) for v in xrange(100000)]]]

    for key_name, values in key_value_pairs:
        upsert_key_values(service, key_name, values)


if __name__ == '__main__':
    add_sortable_keys()

